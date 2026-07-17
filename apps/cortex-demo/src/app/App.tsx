import { CortexProvider } from '../state/CortexProvider';
import { OrbitPage } from '../pages/OrbitPage/OrbitPage';

export function App() {
  return (
    <CortexProvider>
      <OrbitPage />
    </CortexProvider>
  );
}
