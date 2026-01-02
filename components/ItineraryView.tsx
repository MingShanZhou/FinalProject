import React, { useState, useEffect } from 'react';
import { TripData, Activity, HotelDetails, DayPlan, WeatherInfo } from '../types';
import { 
    MapPin, Utensils, Bus, Camera, Clock, Plane, BedDouble, 
    Star, ExternalLink, Plus, X, Edit3, Trash2, Save, Search, Loader2,
    Navigation, Info, ShoppingBag, Music, Landmark, Cloud, Sun, CloudRain, Snowflake, CloudLightning, Calendar, Check
} from 'lucide-react';
import { getActivityColorClass, getActivityTypeName } from '../utils/travelLibrary';
import { getLocationDetails, getWeatherForecast } from '../services/geminiService';

interface ItineraryViewProps {
  tripData: TripData;
  activeDay: number;
  onTripUpdate: (newTripData: TripData) => void;
}

const ItineraryView: React.FC<ItineraryViewProps> = ({ tripData, activeDay, onTripUpdate }) => {
  const activePlan = tripData.itinerary.find(d => d.day === activeDay);
  
  // State for Editing/Adding
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Activity>>({
      time: '09:00',
      type: 'sight',
      description: '',
      location: { lat: 0, lng: 0, name: '', address: '' },
      durationMinutes: 60
  });

  // Flight specific form state
  const [flightData, setFlightData] = useState({
      departureAirport: 'TPE',
      arrivalAirport: 'NRT',
      flightNumber: '',
      arrivalTime: '13:00'
  });

  // City Editing State
  const [isEditingCity, setIsEditingCity] = useState(false);
  const [cityInput, setCityInput] = useState('');

  // Fetch Weather Effect
  useEffect(() => {
    if (!activePlan) return;
    
    // Set initial city input
    setCityInput(activePlan.location || tripData.destination);

    const fetchWeather = async () => {
        if (!activePlan.weather && activePlan.location) {
            // Calculate real date string YYYY-MM-DD
            const startDate = new Date(tripData.startDate);
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + (activeDay - 1));
            const dateStr = currentDate.toISOString().split('T')[0];

            const weather = await getWeatherForecast(activePlan.location, dateStr);
            
            const newItinerary = tripData.itinerary.map(day => {
                if (day.day === activeDay) {
                    return { ...day, weather: weather };
                }
                return day;
            });
            onTripUpdate({ ...tripData, itinerary: newItinerary });
        }
    };
    fetchWeather();
  }, [activeDay, activePlan?.location]);

  if (!activePlan) return <div className="p-8 text-center text-gray-500">這一天沒有安排行程。</div>;

  // Header Logic
  const getDisplayDate = () => {
      const startDate = new Date(tripData.startDate);
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + (activeDay - 1));
      
      const month = currentDate.getMonth() + 1;
      const date = currentDate.getDate();
      const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
      const dayOfWeek = weekDays[currentDate.getDay()];
      
      return `${month}/${date} (${dayOfWeek})`;
  };

  const updateCity = () => {
      const newItinerary = tripData.itinerary.map(day => {
          if (day.day === activeDay) {
              return { ...day, location: cityInput, weather: undefined }; // Reset weather to re-fetch
          }
          return day;
      });
      onTripUpdate({ ...tripData, itinerary: newItinerary });
      setIsEditingCity(false);
  };

  const getWeatherIcon = (iconName: string = 'sun') => {
      const className = "w-6 h-6 text-indigo-600";
      if (iconName.includes('rain')) return <CloudRain className={className} />;
      if (iconName.includes('cloud')) return <Cloud className={className} />;
      if (iconName.includes('snow')) return <Snowflake className={className} />;
      if (iconName.includes('storm')) return <CloudLightning className={className} />;
      return <Sun className={className} />;
  };

  // Handlers
  const openAddModal = (type: string = 'sight') => {
      setEditingActivity(null);
      setFormData({
          time: '09:00',
          type: type as any,
          description: '',
          location: { lat: 0, lng: 0, name: '', address: '' },
          durationMinutes: type === 'flight' ? 180 : 60
      });
      setIsModalOpen(true);
  };

  const openEditModal = (activity: Activity) => {
      setEditingActivity(activity);
      setFormData({ ...activity });
      if (activity.type === 'flight' && activity.flightDetails) {
          setFlightData({
              departureAirport: activity.flightDetails.departureAirport,
              arrivalAirport: activity.flightDetails.arrivalAirport,
              flightNumber: activity.flightDetails.flightNumber,
              arrivalTime: activity.flightDetails.arrivalTime
          });
      }
      setIsModalOpen(true);
  };

  const handleDelete = (activityId: string) => {
      if(!window.confirm("確定要刪除此行程嗎？")) return;
      
      const newItinerary = tripData.itinerary.map(day => {
          if (day.day !== activeDay) return day;
          return {
              ...day,
              activities: day.activities.filter(a => a.id !== activityId)
          };
      });
      onTripUpdate({ ...tripData, itinerary: newItinerary });
  };

  const handleSmartSearch = async () => {
      if (!formData.location?.name) return;
      setIsSearching(true);
      const result = await getLocationDetails(formData.location.name, tripData.destination);
      
      setFormData(prev => ({
          ...prev,
          description: prev.description || result.description,
          location: {
              name: prev.location?.name || '',
              lat: result.lat || 0,
              lng: result.lng || 0,
              address: result.address || ''
          }
      }));
      setIsSearching(false);
  };

  const handleSave = () => {
      if (!formData.time || !formData.location?.name) {
          alert("請填寫時間與地點名稱");
          return;
      }

      const newActivity: Activity = {
          id: editingActivity ? editingActivity.id : Date.now().toString(),
          time: formData.time!,
          type: formData.type as any,
          description: formData.description || '',
          location: formData.location!,
          durationMinutes: formData.durationMinutes || 60,
          flightDetails: formData.type === 'flight' ? {
              departureTime: formData.time!,
              departureAirport: flightData.departureAirport,
              arrivalTime: flightData.arrivalTime,
              arrivalAirport: flightData.arrivalAirport,
              flightNumber: flightData.flightNumber,
              duration: '依時間計算', // 簡化
              airline: '航班'
          } : undefined
      };

      const newItinerary = tripData.itinerary.map(day => {
          if (day.day !== activeDay) return day;
          
          let updatedActivities = editingActivity 
              ? day.activities.map(a => a.id === editingActivity.id ? newActivity : a)
              : [...day.activities, newActivity];
          
          // Sort by time
          updatedActivities.sort((a, b) => a.time.localeCompare(b.time));

          return { ...day, activities: updatedActivities };
      });

      onTripUpdate({ ...tripData, itinerary: newItinerary });
      setIsModalOpen(false);
  };

  const openGoogleMaps = (activity: Activity) => {
      const { lat, lng, name, address } = activity.location;
      let query = '';
      if (lat && lng && lat !== 0 && lng !== 0) {
          query = `${lat},${lng}`;
      } else {
          // Fallback to name search if no coordinates
          query = encodeURIComponent(`${name} ${address || ''}`);
      }
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  // Render Helpers
  const getIcon = (type: string) => {
    switch (type) {
      case 'food': return <Utensils className="w-3.5 h-3.5" />;
      case 'transport': return <Bus className="w-3.5 h-3.5" />;
      case 'sight': return <Camera className="w-3.5 h-3.5" />;
      case 'flight': return <Plane className="w-3.5 h-3.5" />;
      case 'shopping': return <ShoppingBag className="w-3.5 h-3.5" />;
      default: return <MapPin className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="pb-40 pt-4 px-4 bg-gray-50 min-h-full overflow-x-hidden relative">
        
        {/* Date & Weather Header */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row justify-between sm:items-end gap-2">
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none mb-1">
                    {getDisplayDate()}
                </h1>
            </div>
            <div className="flex flex-row sm:flex-col justify-between items-end">
                {activePlan.weather ? (
                    <div className="flex items-center gap-2 mb-1">
                        {getWeatherIcon(activePlan.weather.icon)}
                        <span className="text-xl font-black text-indigo-600">
                            {activePlan.weather.minTemp}° - {activePlan.weather.maxTemp}°
                        </span>
                    </div>
                ) : (
                    <div className="h-7 w-24 bg-gray-100 rounded-md animate-pulse mb-1" />
                )}
                
                {isEditingCity ? (
                    <div className="flex items-center gap-1">
                        <input 
                            value={cityInput}
                            onChange={(e) => setCityInput(e.target.value)}
                            className="w-24 text-right text-xs text-gray-500 font-bold border-b border-gray-300 focus:outline-none focus:border-teal-500"
                            autoFocus
                            onBlur={updateCity}
                            onKeyDown={(e) => e.key === 'Enter' && updateCity()}
                        />
                        <button onClick={updateCity} className="text-teal-600"><Check className="w-3 h-3"/></button>
                    </div>
                ) : (
                    <button 
                        onClick={() => setIsEditingCity(true)}
                        className="text-xs text-gray-400 font-bold flex items-center gap-1 hover:text-gray-600"
                    >
                        <Calendar className="w-3 h-3"/> 
                        {activePlan.location || tripData.destination} (預報)
                    </button>
                )}
            </div>
        </div>

        {/* Top Actions */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 hide-scrollbar">
            <button onClick={() => openAddModal('flight')} className="flex items-center gap-1 bg-blue-100 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap hover:bg-blue-200">
                <Plane className="w-4 h-4"/> 新增航班
            </button>
            <button onClick={() => openAddModal('sight')} className="flex items-center gap-1 bg-teal-100 text-teal-700 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap hover:bg-teal-200">
                <MapPin className="w-4 h-4"/> 新增景點
            </button>
            <button onClick={() => openAddModal('food')} className="flex items-center gap-1 bg-orange-100 text-orange-700 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap hover:bg-orange-200">
                <Utensils className="w-4 h-4"/> 新增餐廳
            </button>
            <button onClick={() => openAddModal('transport')} className="flex items-center gap-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap hover:bg-gray-300">
                <Bus className="w-4 h-4"/> 新增交通
            </button>
        </div>

        {/* Timeline */}
        <div className="space-y-6 relative pl-3">
            {/* Timeline Line */}
            <div className="absolute inset-y-0 left-[18px] w-[2px] bg-teal-100" />
            
            {activePlan.activities.map((activity) => (
                <div key={activity.id} className="relative flex items-start gap-3 group">
                    
                    {/* Timeline Dot */}
                    <div className="absolute left-[13px] top-8 w-3 h-3 rounded-full bg-teal-400 border-2 border-white ring-2 ring-teal-100 z-10" />

                    {/* Card Container */}
                    <div 
                        onClick={() => openEditModal(activity)}
                        className="flex-1 ml-6 bg-white rounded-2xl shadow-sm border border-gray-100 flex overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    >
                        {/* Left: Time & Type */}
                        <div className="w-[88px] p-3 flex flex-col justify-between shrink-0 border-r border-gray-50">
                            <div className="bg-gray-50 rounded-xl h-16 flex flex-col items-center justify-center mb-2">
                                <span className="text-[10px] text-gray-400 font-bold mb-0.5">時間</span>
                                <span className="text-gray-800 font-black text-lg leading-none tracking-tight">
                                    {activity.time}
                                </span>
                            </div>
                            <div className={`rounded-lg py-1.5 px-1 flex items-center justify-center gap-1.5 text-[10px] font-bold text-white shadow-sm ${getActivityColorClass(activity.type)}`}>
                                {getIcon(activity.type)}
                                <span className="truncate">{getActivityTypeName(activity.type)}</span>
                            </div>
                        </div>

                        {/* Middle: Content */}
                        <div className="flex-1 p-4 flex flex-col justify-center min-w-0">
                            {activity.type === 'flight' && activity.flightDetails ? (
                                <div>
                                    <h3 className="font-black text-gray-900 text-lg mb-1 truncate">
                                        {activity.flightDetails.departureAirport} <span className="text-gray-300">✈</span> {activity.flightDetails.arrivalAirport}
                                    </h3>
                                    <p className="text-sm text-gray-500 font-bold mb-1">航班 {activity.flightDetails.flightNumber}</p>
                                    <p className="text-xs text-gray-400">抵達: {activity.flightDetails.arrivalTime}</p>
                                </div>
                            ) : (
                                <>
                                    <h3 className="font-black text-gray-900 text-lg mb-2 leading-tight truncate">
                                        {activity.location.name}
                                    </h3>
                                    
                                    {activity.location.address ? (
                                        <div className="flex items-start gap-1.5 mb-1.5">
                                            <MapPin className="w-3.5 h-3.5 text-teal-500 mt-0.5 shrink-0" />
                                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed break-words">
                                                {activity.location.address}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 mb-1.5 opacity-50">
                                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                            <p className="text-xs text-gray-400">未設定地址</p>
                                        </div>
                                    )}

                                    {activity.description && (
                                        <div className="flex items-start gap-1.5">
                                            <Info className="w-3.5 h-3.5 text-orange-400 mt-0.5 shrink-0" />
                                            <p className="text-xs text-gray-400 line-clamp-1">
                                                {activity.description}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Right: Actions */}
                        <div className="w-12 flex flex-col items-center justify-between py-4 border-l border-gray-50 bg-gray-50/30">
                            <button 
                                onClick={(e) => { e.stopPropagation(); openGoogleMaps(activity); }}
                                className="p-2 rounded-full text-teal-500 hover:bg-teal-50 transition-colors"
                                title="開啟地圖"
                            >
                                <Navigation className="w-5 h-5 fill-current" />
                            </button>
                            
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDelete(activity.id); }}
                                className="p-2 rounded-full text-red-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                    </div>
                </div>
            ))}

            {activePlan.activities.length === 0 && (
                <div className="text-center py-12 ml-4">
                    <div className="inline-block p-4 bg-gray-100 rounded-full mb-3">
                        <Plus className="w-6 h-6 text-gray-400"/>
                    </div>
                    <p className="text-sm text-gray-500 font-bold">目前沒有行程</p>
                    <p className="text-xs text-gray-400 mt-1">點擊上方按鈕開始規劃</p>
                </div>
            )}
        </div>

        {/* Edit/Add Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={() => setIsModalOpen(false)} />
                <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl transform transition-transform pointer-events-auto max-h-[90vh] overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
                    
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-black text-gray-800">
                            {editingActivity ? '編輯行程' : '新增行程'}
                        </h3>
                        <button onClick={() => setIsModalOpen(false)} className="bg-gray-100 p-2 rounded-full">
                            <X className="w-5 h-5 text-gray-500"/>
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Type Selection */}
                        <div className="flex gap-2 overflow-x-auto pb-2">
                             {['sight', 'food', 'transport', 'flight', 'shopping', 'other'].map(t => (
                                 <button
                                    key={t}
                                    onClick={() => setFormData({...formData, type: t as any})}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors whitespace-nowrap ${
                                        formData.type === t 
                                        ? 'bg-teal-600 text-white border-teal-600' 
                                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                    }`}
                                 >
                                     {getActivityTypeName(t)}
                                 </button>
                             ))}
                        </div>

                        {/* Common Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase">開始時間</label>
                                <input 
                                    type="time" 
                                    className="w-full mt-1 p-3 bg-gray-50 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-teal-500"
                                    value={formData.time}
                                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                                />
                            </div>
                             {formData.type === 'flight' && (
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase">抵達時間</label>
                                    <input 
                                        type="time" 
                                        className="w-full mt-1 p-3 bg-gray-50 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-teal-500"
                                        value={flightData.arrivalTime}
                                        onChange={(e) => setFlightData({...flightData, arrivalTime: e.target.value})}
                                    />
                                </div>
                            )}
                        </div>

                        {formData.type === 'flight' ? (
                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase">航班號</label>
                                    <input 
                                        className="w-full mt-1 p-3 bg-gray-50 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-teal-500"
                                        placeholder="JX800"
                                        value={flightData.flightNumber}
                                        onChange={e => setFlightData({...flightData, flightNumber: e.target.value})}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase">出發機場</label>
                                    <input 
                                        className="w-full mt-1 p-3 bg-gray-50 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-teal-500"
                                        placeholder="TPE"
                                        value={flightData.departureAirport}
                                        onChange={e => setFlightData({...flightData, departureAirport: e.target.value})}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase">抵達機場</label>
                                    <input 
                                        className="w-full mt-1 p-3 bg-gray-50 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-teal-500"
                                        placeholder="NRT"
                                        value={flightData.arrivalAirport}
                                        onChange={e => setFlightData({...flightData, arrivalAirport: e.target.value})}
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase flex justify-between">
                                        <span>地點名稱</span>
                                        <span className="text-teal-500 cursor-pointer flex items-center gap-1" onClick={handleSmartSearch}>
                                            {isSearching ? <Loader2 className="w-3 h-3 animate-spin"/> : <Search className="w-3 h-3"/>}
                                            AI 自動填寫資訊
                                        </span>
                                    </label>
                                    <input 
                                        className="w-full mt-1 p-3 bg-gray-50 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-teal-500"
                                        placeholder="例如：東京鐵塔"
                                        value={formData.location?.name}
                                        onChange={(e) => setFormData({...formData, location: { ...formData.location!, name: e.target.value }})}
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1 ml-1">若使用 AI 填寫，將自動搜尋地址與座標供地圖使用。</p>
                                </div>
                                
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase">地址</label>
                                    <input 
                                        className="w-full mt-1 p-3 bg-gray-50 rounded-xl text-sm text-gray-600 outline-none focus:ring-2 focus:ring-teal-500"
                                        placeholder="地址資訊..."
                                        value={formData.location?.address || ''}
                                        onChange={(e) => setFormData({...formData, location: { ...formData.location!, address: e.target.value }})}
                                    />
                                </div>
                            </>
                        )}

                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase">備註 / 描述</label>
                            <textarea 
                                className="w-full mt-1 p-3 bg-gray-50 rounded-xl text-sm text-gray-800 outline-none focus:ring-2 focus:ring-teal-500 min-h-[80px]"
                                placeholder="備註事項..."
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                            />
                        </div>

                        <button 
                            onClick={handleSave}
                            className="w-full bg-teal-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-teal-700 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
                        >
                            <Save className="w-5 h-5"/> 儲存行程
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default ItineraryView;