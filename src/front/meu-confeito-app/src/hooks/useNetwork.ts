import { useEffect, useState } from 'react';

import { NetworkService } from '../services/network';

export function useNetwork() {
  const [isOnline, setIsOnline] = useState<boolean>(NetworkService.getIsOnline());

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = NetworkService.subscribe((onlineStatus) => {
      if (isMounted) {
        setIsOnline(onlineStatus);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    checkConnectivity: NetworkService.checkConnectivity.bind(NetworkService),
  };
}
