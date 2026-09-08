import { Stack } from 'expo-router';

import { NearbyBakersExplorer } from '@/src/components/baker';

export default function SearchBakersScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Buscar Confeitarias' }} />
      <NearbyBakersExplorer hasIntroHeader={true} />
    </>
  );
}
