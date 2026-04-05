import { useState } from 'react';
import WeatherPage from './pages/WeatherPage';
import WeatherDetail from './pages/WeatherDetail';

export default function App() {
  const [page, setPage] = useState<'home' | 'detail'>('home');
  const [shared, setShared] = useState<any>({
    current: null, airData: null, sky: 1, pty: 0, hour: new Date().getHours(),
  });

  return page === 'home' ? (
    <WeatherPage onNavigateDetail={() => setPage('detail')} onStateUpdate={setShared} />
  ) : (
    <WeatherDetail {...shared} onBack={() => setPage('home')} />
  );
}