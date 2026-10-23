import { Redirect, useLocalSearchParams } from 'expo-router';

export default function ProductionsRedirect() {
  const params = useLocalSearchParams();
  return (
    <Redirect
      href={{
        pathname: '/operations-history',
        params: { tab: 'productions', ...params },
      }}
    />
  );
}
