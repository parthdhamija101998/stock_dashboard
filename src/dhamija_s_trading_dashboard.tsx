// 1. The Pure Clock: Only counts down, no side effects
  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshCountdown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. The API Trigger: Fires ONLY when the clock hits zero
  useEffect(() => {
    if (refreshCountdown <= 0) {
      const syncActiveStockData = async () => {
        // Fetch the fresh data for the currently selected stock
        const freshData = await getAlphaVantageQuote(selectedStock);
        
        // Update the ticker list with the new data
        setTickerList(currentList => ({
          ...currentList,
          [selectedStock]: freshData
        }));
        
        // Update the timestamp and reset the clock to 30
        const now = new Date();
        setLastSyncedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        setRefreshCountdown(30); 
      };

      syncActiveStockData();
    }
  }, [refreshCountdown, selectedStock]);

  // 3. The Switcher: Instantly forces a refresh when you click a new stock
  useEffect(() => {
    // Simply forces the clock to 0, which perfectly triggers Hook #2 above
    setRefreshCountdown(0); 
  }, [selectedStock]);
