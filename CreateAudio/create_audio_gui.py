"""
create_audio_gui.py - Simple desktop app for ElevenLabs text-to-speech.

This is a single, self-contained file - no other project files needed.

RUN:
    python create_audio_gui.py

No manual "pip install" needed - the first time you run this, it will
automatically install any missing packages (customtkinter, requests)
for you.

Your API key and settings are saved to config.json next to this script,
so you only type the API key once - it will be pre-filled every time
you open the app afterwards.

Generated audio is saved into the output folder as Audio001, Audio002,
Audio003, ... (auto-incrementing, never overwrites existing files).
"""

import importlib
import json
import os
import re
import subprocess
import sys
import threading

# ----------------------------------------------------------------------
# Make sure tkinter is available (bundled with standard Python on Windows/
# macOS installers, but sometimes missing from minimal/Linux installs).
# ----------------------------------------------------------------------
try:
    import tkinter
    from tkinter import filedialog, messagebox
except ImportError:
    print(
        "ERROR: tkinter is not available in this Python installation.\n"
        "Reinstall Python from https://python.org and make sure the "
        "'tcl/tk and IDLE' option is checked during setup."
    )
    sys.exit(1)


def _ensure_installed(pip_name, import_name=None):
    """Import a package, auto-installing it via pip first if it's missing."""
    import_name = import_name or pip_name
    try:
        return importlib.import_module(import_name)
    except ImportError:
        print("Installing missing dependency: " + pip_name + " ...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "--user", pip_name])
        except subprocess.CalledProcessError as e:
            messagebox.showerror(
                "Missing Dependency",
                "Could not automatically install '" + pip_name + "'.\n\n"
                "Please open a terminal and run:\n\n    pip install " + pip_name + "\n\n"
                "Details: " + str(e),
            )
            sys.exit(1)
        return importlib.import_module(import_name)


ctk = _ensure_installed("customtkinter")
requests = _ensure_installed("requests")


# ============================================================================
# ElevenLabs API logic (previously in create_audio.py, now inlined so this
# is a single self-contained file)
# ============================================================================

BASE_URL = "https://api.elevenlabs.io"

DEFAULT_VOICE_NAME = "Adam"
DEFAULT_MODEL_ID = "eleven_multilingual_v2"
DEFAULT_OUTPUT_FORMAT = "mp3_44100_128"
DEFAULT_VOICE_SETTINGS = {
    "stability": 0.6,
    "similarity_boost": 0.85,
    "style": 0.0,
    "use_speaker_boost": True,
    "speed": 1.0,
}

FORMAT_EXTENSIONS = {
    "mp3": "mp3",
    "pcm": "wav",
    "ulaw": "ulaw",
    "alaw": "alaw",
    "opus": "opus",
}

VOICE_ID_PATTERN = re.compile(r"^[A-Za-z0-9]{16,40}$")


class ElevenLabsError(Exception):
    """Raised whenever a call to the ElevenLabs API fails, with a human-readable message."""


def list_voices(api_key):
    try:
        resp = requests.get(
            BASE_URL + "/v1/voices",
            headers={"xi-api-key": api_key},
            timeout=30,
        )
    except requests.exceptions.RequestException as e:
        raise ElevenLabsError("Network error while fetching voices: " + str(e))

    if resp.status_code == 401:
        raise ElevenLabsError(
            "Invalid API key, or this API key doesn't have permission to list voices "
            "(401 Unauthorized while calling GET /v1/voices)."
        )
    if resp.status_code != 200:
        raise ElevenLabsError("Failed to fetch voices (" + str(resp.status_code) + "): " + resp.text)

    return resp.json().get("voices", [])


def resolve_voice(api_key, voice_query):
    """voice_query can be an exact voice_id or a name / partial name to search for.
    Returns (voice_id, resolved_name).

    If voice_query already looks like a raw voice_id, it is used directly
    without calling GET /v1/voices first. This avoids failures for API keys
    that are restricted to Text-to-Speech only (no voices:read permission).
    """
    voice_query = (voice_query or "").strip()
    if not voice_query:
        raise ElevenLabsError("No voice name or voice ID provided.")

    if VOICE_ID_PATTERN.match(voice_query):
        return voice_query, voice_query

    voices = list_voices(api_key)

    for v in voices:
        if v.get("voice_id") == voice_query:
            return v["voice_id"], v.get("name", voice_query)

    for v in voices:
        if voice_query.lower() in v.get("name", "").lower():
            return v["voice_id"], v.get("name")

    raise ElevenLabsError("No voice matching '" + voice_query + "' found in your ElevenLabs account.")


def generate_speech_bytes(api_key, text, voice_id, model_id=None, voice_settings=None, output_format=None):
    """Calls the ElevenLabs API and returns the raw audio bytes, or raises ElevenLabsError."""
    if model_id is None:
        model_id = DEFAULT_MODEL_ID
    if output_format is None:
        output_format = DEFAULT_OUTPUT_FORMAT
    if voice_settings is None:
        voice_settings = DEFAULT_VOICE_SETTINGS

    if not api_key:
        raise ElevenLabsError("API key is missing.")
    if not text or not text.strip():
        raise ElevenLabsError("Text is empty.")
    if not voice_id:
        raise ElevenLabsError("No voice selected.")

    try:
        resp = requests.post(
            BASE_URL + "/v1/text-to-speech/" + voice_id,
            params={"output_format": output_format},
            headers={"xi-api-key": api_key, "Content-Type": "application/json"},
            json={"text": text, "model_id": model_id, "voice_settings": voice_settings},
            timeout=120,
        )
    except requests.exceptions.Timeout:
        raise ElevenLabsError("Request timed out. Check your internet connection and try again.")
    except requests.exceptions.ConnectionError:
        raise ElevenLabsError("Could not connect to ElevenLabs. Check your internet connection.")
    except requests.exceptions.RequestException as e:
        raise ElevenLabsError("Network error: " + str(e))

    if resp.status_code == 200:
        if not resp.content:
            raise ElevenLabsError("ElevenLabs returned an empty audio response.")
        return resp.content

    detail = resp.text
    try:
        data = resp.json()
        detail = data.get("detail", data)
        if isinstance(detail, dict):
            detail = detail.get("message", str(detail))
    except ValueError:
        pass

    if resp.status_code == 401:
        raise ElevenLabsError("Invalid API key or insufficient permissions (401 Unauthorized): " + str(detail))
    elif resp.status_code == 422:
        raise ElevenLabsError("Invalid request (422): " + str(detail))
    elif resp.status_code == 429:
        raise ElevenLabsError("Rate limit or quota exceeded (429). Try again later or check your ElevenLabs credits.")
    else:
        raise ElevenLabsError("ElevenLabs API error " + str(resp.status_code) + ": " + str(detail))


def extension_for_format(output_format):
    prefix = (output_format or "").split("_")[0].lower()
    return FORMAT_EXTENSIONS.get(prefix, "mp3")


def next_output_path(output_dir, base_name, extension):
    """Returns the next available auto-numbered path, e.g. Audio001.mp3, Audio002.mp3, ...
    Creates output_dir if it doesn't exist yet.
    """
    os.makedirs(output_dir, exist_ok=True)

    pattern = re.compile("^" + re.escape(base_name) + r"(\d+)\." + re.escape(extension) + "$", re.IGNORECASE)
    max_n = 0
    width = 3
    for fname in os.listdir(output_dir):
        m = pattern.match(fname)
        if m:
            num_str = m.group(1)
            max_n = max(max_n, int(num_str))
            width = max(width, len(num_str))

    next_n = max_n + 1
    return os.path.join(output_dir, base_name + str(next_n).zfill(width) + "." + extension)


# ============================================================================
# GUI
# ============================================================================

APP_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(APP_DIR, "config.json")

MODEL_OPTIONS = [
    "eleven_multilingual_v2",
    "eleven_turbo_v2_5",
    "eleven_flash_v2_5",
    "eleven_v3",
]
OUTPUT_FORMAT_OPTIONS = [
    "mp3_44100_128",
    "mp3_44100_192",
    "mp3_44100_64",
    "mp3_22050_32",
    "pcm_44100",
    "pcm_24000",
    "ulaw_8000",
]

# Defaults below mirror the ElevenLabs UI settings shown in the reference screenshot.
DEFAULT_CONFIG = {
    "api_key": "",
    #voice": "MltcMkX8tlDeUdYq1uCd",   # Richard - Elegant and Resonant
    #"voice": "QIhD5ivPGEoYZQDocuHI",   # Adam - Articulate Engineering Professor
    "voice": "qHR09fcvu6SoDtFzqFvm",   # Ryan - Articulate, Friendly and Youthful

    "model_id": "eleven_multilingual_v2",
    "output_format": "mp3_44100_128",
    "output_dir": os.path.join(APP_DIR, "Audio Output"),
    "base_name": "Audio",
    "stability": 0.42,
    "similarity_boost": 0.70,
    "style": 0.15,
    "speed": 1.02,
    "use_speaker_boost": True,
}


def load_config():
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            cfg = DEFAULT_CONFIG.copy()
            cfg.update(data)
            return cfg
        except (json.JSONDecodeError, OSError):
            pass
    return DEFAULT_CONFIG.copy()


def save_config(cfg):
    try:
        with open(CONFIG_PATH, "w", encoding="utf-8") as f:
            json.dump(cfg, f, indent=2)
    except OSError:
        pass


class App(ctk.CTk):
    def __init__(self):
        super().__init__()

        ctk.set_appearance_mode("System")
        ctk.set_default_color_theme("blue")

        self.title("ElevenLabs Text to Speech")
        self.geometry("620x780")
        self.minsize(560, 700)

        self.cfg = load_config()
        self.is_generating = False

        self._build_ui()

    # ------------------------------------------------------------------
    # UI construction
    # ------------------------------------------------------------------
    def _build_ui(self):
        pad = {"padx": 20, "pady": (12, 0)}

        container = ctk.CTkScrollableFrame(self, corner_radius=0, fg_color="transparent")
        container.pack(fill="both", expand=True)

        header = ctk.CTkLabel(
            container, text="ElevenLabs Text to Speech",
            font=ctk.CTkFont(size=20, weight="bold"),
        )
        header.pack(anchor="w", padx=20, pady=(20, 0))

        subtitle = ctk.CTkLabel(
            container, text="Enter your API key once, paste your text, and generate audio.",
            font=ctk.CTkFont(size=12), text_color=("gray30", "gray70"),
        )
        subtitle.pack(anchor="w", padx=20, pady=(2, 0))

        # ---------------- API key ----------------
        ctk.CTkLabel(container, text="ElevenLabs API Key", font=ctk.CTkFont(weight="bold")).pack(anchor="w", **pad)
        api_row = ctk.CTkFrame(container, fg_color="transparent")
        api_row.pack(fill="x", padx=20, pady=(4, 0))
        api_row.grid_columnconfigure(0, weight=1)

        self.api_key_var = ctk.StringVar(value=self.cfg.get("api_key", ""))
        self.api_key_entry = ctk.CTkEntry(api_row, textvariable=self.api_key_var, show="*", placeholder_text="xi-api-key")
        self.api_key_entry.grid(row=0, column=0, sticky="ew")

        self.show_key = False
        self.toggle_key_btn = ctk.CTkButton(api_row, text="Show", width=60, command=self._toggle_key_visibility)
        self.toggle_key_btn.grid(row=0, column=1, padx=(8, 0))

        # ---------------- Text ----------------
        ctk.CTkLabel(container, text="Text to Convert", font=ctk.CTkFont(weight="bold")).pack(anchor="w", **pad)
        self.text_box = ctk.CTkTextbox(container, height=140)
        self.text_box.pack(fill="x", padx=20, pady=(4, 0))

        # ---------------- Voice & Model ----------------
        ctk.CTkLabel(container, text="Voice & Model", font=ctk.CTkFont(weight="bold")).pack(anchor="w", **pad)

        voice_row = ctk.CTkFrame(container, fg_color="transparent")
        voice_row.pack(fill="x", padx=20, pady=(4, 0))
        voice_row.grid_columnconfigure((0, 1), weight=1)

        ctk.CTkLabel(voice_row, text="Voice (name or ID)", font=ctk.CTkFont(size=11)).grid(row=0, column=0, sticky="w")
        ctk.CTkLabel(voice_row, text="Model", font=ctk.CTkFont(size=11)).grid(row=0, column=1, sticky="w", padx=(8, 0))

        self.voice_var = ctk.StringVar(value=self.cfg.get("voice", DEFAULT_VOICE_NAME))
        self.voice_entry = ctk.CTkEntry(voice_row, textvariable=self.voice_var)
        self.voice_entry.grid(row=1, column=0, sticky="ew")

        self.model_var = ctk.StringVar(value=self.cfg.get("model_id", DEFAULT_MODEL_ID))
        self.model_menu = ctk.CTkComboBox(voice_row, values=MODEL_OPTIONS, variable=self.model_var)
        self.model_menu.grid(row=1, column=1, sticky="ew", padx=(8, 0))

        # ---------------- Sliders ----------------
        self.stability_var = ctk.DoubleVar(value=self.cfg.get("stability", 0.6))
        self.similarity_var = ctk.DoubleVar(value=self.cfg.get("similarity_boost", 0.85))
        self.style_var = ctk.DoubleVar(value=self.cfg.get("style", 0.0))
        self.speed_var = ctk.DoubleVar(value=self.cfg.get("speed", 1.0))

        self._build_slider(container, "Stability", self.stability_var, 0.0, 1.0, "More variable", "More stable")
        self._build_slider(container, "Similarity", self.similarity_var, 0.0, 1.0, "Low", "High")
        self._build_slider(container, "Style Exaggeration", self.style_var, 0.0, 1.0, "None", "Exaggerated")
        self._build_slider(container, "Speed", self.speed_var, 0.7, 1.2, "Slower", "Faster")

        # ---------------- Speaker boost + output format ----------------
        row2 = ctk.CTkFrame(container, fg_color="transparent")
        row2.pack(fill="x", padx=20, pady=(14, 0))
        row2.grid_columnconfigure((0, 1), weight=1)

        self.speaker_boost_var = ctk.BooleanVar(value=self.cfg.get("use_speaker_boost", True))
        self.speaker_boost_switch = ctk.CTkSwitch(row2, text="Speaker Boost", variable=self.speaker_boost_var)
        self.speaker_boost_switch.grid(row=0, column=0, sticky="w")

        ctk.CTkLabel(row2, text="Output Format", font=ctk.CTkFont(size=11)).grid(row=0, column=1, sticky="w", padx=(8, 0))
        self.format_var = ctk.StringVar(value=self.cfg.get("output_format", DEFAULT_OUTPUT_FORMAT))
        self.format_menu = ctk.CTkComboBox(row2, values=OUTPUT_FORMAT_OPTIONS, variable=self.format_var)
        self.format_menu.grid(row=1, column=1, sticky="ew", padx=(8, 0), pady=(4, 0))

        # ---------------- Output folder / filename ----------------
        ctk.CTkLabel(container, text="Output", font=ctk.CTkFont(weight="bold")).pack(anchor="w", **pad)

        folder_row = ctk.CTkFrame(container, fg_color="transparent")
        folder_row.pack(fill="x", padx=20, pady=(4, 0))
        folder_row.grid_columnconfigure(0, weight=1)

        self.output_dir_var = ctk.StringVar(value=self.cfg.get("output_dir"))
        self.output_dir_entry = ctk.CTkEntry(folder_row, textvariable=self.output_dir_var)
        self.output_dir_entry.grid(row=0, column=0, sticky="ew")
        ctk.CTkButton(folder_row, text="Browse", width=70, command=self._browse_folder).grid(row=0, column=1, padx=(8, 0))

        name_row = ctk.CTkFrame(container, fg_color="transparent")
        name_row.pack(fill="x", padx=20, pady=(8, 0))
        ctk.CTkLabel(name_row, text="File name prefix:").pack(side="left")
        self.base_name_var = ctk.StringVar(value=self.cfg.get("base_name", "Audio"))
        ctk.CTkEntry(name_row, textvariable=self.base_name_var, width=120).pack(side="left", padx=(8, 0))
        ctk.CTkLabel(name_row, text="(saved as Audio001, Audio002, ...)", font=ctk.CTkFont(size=11), text_color=("gray30", "gray70")).pack(side="left", padx=(8, 0))

        # ---------------- Generate button ----------------
        self.generate_btn = ctk.CTkButton(
            container, text="Generate Audio", height=42, font=ctk.CTkFont(size=14, weight="bold"),
            command=self._on_generate_clicked,
        )
        self.generate_btn.pack(fill="x", padx=20, pady=(20, 0))

        self.progress_bar = ctk.CTkProgressBar(container, mode="indeterminate")

        # ---------------- Status ----------------
        self.status_label = ctk.CTkLabel(
            container, text="", font=ctk.CTkFont(size=12), justify="left", wraplength=560,
        )
        self.status_label.pack(anchor="w", fill="x", padx=20, pady=(12, 0))

        self.open_folder_btn = ctk.CTkButton(
            container, text="Open Output Folder", fg_color="transparent", border_width=1,
            command=self._open_output_folder,
        )
        self.last_output_dir = None

        ctk.CTkLabel(container, text="", height=10).pack()  # bottom spacer

    def _build_slider(self, parent, label, var, min_v, max_v, left_hint, right_hint):
        frame = ctk.CTkFrame(parent, fg_color="transparent")
        frame.pack(fill="x", padx=20, pady=(14, 0))

        top = ctk.CTkFrame(frame, fg_color="transparent")
        top.pack(fill="x")
        ctk.CTkLabel(top, text=label, font=ctk.CTkFont(size=12)).pack(side="left")
        value_label = ctk.CTkLabel(top, text="{:.2f}".format(var.get()), font=ctk.CTkFont(size=12))
        value_label.pack(side="right")

        def on_change(v):
            value_label.configure(text="{:.2f}".format(float(v)))

        slider = ctk.CTkSlider(frame, from_=min_v, to=max_v, variable=var, command=on_change)
        slider.pack(fill="x", pady=(4, 0))

        hint_row = ctk.CTkFrame(frame, fg_color="transparent")
        hint_row.pack(fill="x")
        ctk.CTkLabel(hint_row, text=left_hint, font=ctk.CTkFont(size=10), text_color=("gray40", "gray60")).pack(side="left")
        ctk.CTkLabel(hint_row, text=right_hint, font=ctk.CTkFont(size=10), text_color=("gray40", "gray60")).pack(side="right")

    # ------------------------------------------------------------------
    # UI actions
    # ------------------------------------------------------------------
    def _toggle_key_visibility(self):
        self.show_key = not self.show_key
        self.api_key_entry.configure(show="" if self.show_key else "*")
        self.toggle_key_btn.configure(text="Hide" if self.show_key else "Show")

    def _browse_folder(self):
        folder = filedialog.askdirectory(initialdir=self.output_dir_var.get() or APP_DIR)
        if folder:
            self.output_dir_var.set(folder)

    def _open_output_folder(self):
        path = self.last_output_dir or self.output_dir_var.get()
        if not path or not os.path.isdir(path):
            return
        try:
            if sys.platform.startswith("win"):
                os.startfile(path)
            elif sys.platform == "darwin":
                subprocess.Popen(["open", path])
            else:
                subprocess.Popen(["xdg-open", path])
        except OSError:
            pass

    def _set_status(self, text, kind="info"):
        colors = {
            "info": ("gray20", "gray80"),
            "success": ("#1a7f37", "#4ade80"),
            "error": ("#b91c1c", "#f87171"),
        }
        self.status_label.configure(text=text, text_color=colors.get(kind, colors["info"]))

    def _set_generating(self, generating):
        self.is_generating = generating
        if generating:
            self.generate_btn.configure(state="disabled", text="Generating...")
            self.progress_bar.pack(fill="x", padx=20, pady=(10, 0))
            self.progress_bar.start()
        else:
            self.progress_bar.stop()
            self.progress_bar.pack_forget()
            self.generate_btn.configure(state="normal", text="Generate Audio")

    def _current_settings(self):
        return {
            "api_key": self.api_key_var.get().strip(),
            "voice": self.voice_var.get().strip(),
            "model_id": self.model_var.get().strip(),
            "output_format": self.format_var.get().strip(),
            "output_dir": self.output_dir_var.get().strip(),
            "base_name": self.base_name_var.get().strip() or "Audio",
            "stability": round(self.stability_var.get(), 2),
            "similarity_boost": round(self.similarity_var.get(), 2),
            "style": round(self.style_var.get(), 2),
            "speed": round(self.speed_var.get(), 2),
            "use_speaker_boost": bool(self.speaker_boost_var.get()),
        }

    def _on_generate_clicked(self):
        if self.is_generating:
            return

        settings = self._current_settings()
        text = self.text_box.get("1.0", "end").strip()

        if not settings["api_key"]:
            messagebox.showwarning("Missing API Key", "Please enter your ElevenLabs API key.")
            return
        if not text:
            messagebox.showwarning("Missing Text", "Please enter the text you want to convert.")
            return
        if not settings["voice"]:
            messagebox.showwarning("Missing Voice", "Please enter a voice name or voice ID.")
            return
        if not settings["output_dir"]:
            messagebox.showwarning("Missing Folder", "Please choose an output folder.")
            return

        save_config(settings)  # persist immediately so the API key is remembered next launch

        self._set_generating(True)
        self._set_status("Contacting ElevenLabs...", "info")

        thread = threading.Thread(target=self._generate_worker, args=(settings, text), daemon=True)
        thread.start()

    def _generate_worker(self, settings, text):
        try:
            voice_id, voice_name = resolve_voice(settings["api_key"], settings["voice"])

            voice_settings = {
                "stability": settings["stability"],
                "similarity_boost": settings["similarity_boost"],
                "style": settings["style"],
                "use_speaker_boost": settings["use_speaker_boost"],
                "speed": settings["speed"],
            }

            audio_bytes = generate_speech_bytes(
                api_key=settings["api_key"],
                text=text,
                voice_id=voice_id,
                model_id=settings["model_id"],
                voice_settings=voice_settings,
                output_format=settings["output_format"],
            )

            ext = extension_for_format(settings["output_format"])
            out_path = next_output_path(settings["output_dir"], settings["base_name"], ext)
            with open(out_path, "wb") as f:
                f.write(audio_bytes)

            self.after(0, self._on_success, out_path, voice_name)

        except ElevenLabsError as e:
            self.after(0, self._on_failure, str(e))
        except OSError as e:
            self.after(0, self._on_failure, "Could not save the audio file: " + str(e))
        except Exception as e:
            self.after(0, self._on_failure, "Unexpected error: " + str(e))

    def _on_success(self, out_path, voice_name):
        self._set_generating(False)
        self.last_output_dir = os.path.dirname(out_path)
        self._set_status("Success! Saved as " + os.path.basename(out_path) + " (voice: " + str(voice_name) + ")", "success")
        self.open_folder_btn.pack(anchor="w", padx=20, pady=(8, 0))

    def _on_failure(self, message):
        self._set_generating(False)
        self._set_status("Failed: " + message, "error")
        self.open_folder_btn.pack_forget()


def main():
    app = App()
    app.mainloop()


if __name__ == "__main__":
    main()
