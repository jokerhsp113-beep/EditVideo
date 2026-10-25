import {registerRoot} from 'remotion';
import {MedievalCompositions} from './MedievalRoot';

// Dedicated entrypoint avoids importing legacy compositions/fonts for Medieval renders.
registerRoot(MedievalCompositions);
