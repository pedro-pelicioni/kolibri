import React, { useState } from 'react';

import { ScannerScreen } from './src/screens/ScannerScreen';
import { PlantPassportScreen } from './src/screens/PlantPassportScreen';
import { mockPassport } from './src/mocks/passport.mock';

// Tiny in-file route switcher so the demo runs zero-deps (no react-navigation
// required to render the two screens). Replace with @react-navigation/native
// + native stack once you wire the rest of the app.
type Route = 'scanner' | 'passport';

export default function App() {
  const [route, setRoute] = useState<Route>('scanner');

  if (route === 'passport') {
    return (
      <PlantPassportScreen
        passport={mockPassport}
        onBack={() => setRoute('scanner')}
        onShare={() => {/* Share.share({ url: mockPassport.proof.explorerUrl }) */}}
      />
    );
  }

  return <ScannerScreen onScanned={() => setRoute('passport')} />;
}
