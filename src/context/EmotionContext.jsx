import { createContext, useState, useEffect, useContext } from 'react';
import { format } from 'date-fns';

const EmotionContext = createContext();

// 감정 타입 정의
const EMOTION_TYPES = {
  JOY: { id: 'joy', label: '희(기쁨)', color: '#FFD54F' },
  ANGER: { id: 'anger', label: '노(화남)', color: '#EF5350' },
  SADNESS: { id: 'sadness', label: '애(슬픔)', color: '#64B5F6' },
  PLEASURE: { id: 'pleasure', label: '락(즐거움)', color: '#B39DDB' },
  NEUTRAL: { id: 'neutral', label: '중성', color: '#9E9E9E' }
};

export const EmotionProvider = ({ children }) => {
  // 로컬 스토리지에서 감정 데이터 불러오기
  const [emotionData, setEmotionData] = useState(() => {
    const savedData = localStorage.getItem('emotionData');
    return savedData ? JSON.parse(savedData) : {};
  });

  // 현재 날짜
  const [currentDate, setCurrentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  // 감정 데이터가 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem('emotionData', JSON.stringify(emotionData));
  }, [emotionData]);

  // 감정 기록 추가
  const addEmotionRecord = (emotion, memo, imageUrl = null) => {
    const timestamp = new Date().toISOString();
    const dateKey = format(new Date(), 'yyyy-MM-dd');
    
    setEmotionData(prevData => {
      // 해당 날짜의 기존 기록 가져오기
      const dayRecords = prevData[dateKey] || [];
      
      // 새 기록 추가
      const newRecord = {
        id: `${dateKey}-${dayRecords.length}`,
        timestamp,
        emotion,
        memo,
        imageUrl
      };
      
      // 업데이트된 데이터 반환
      return {
        ...prevData,
        [dateKey]: [...dayRecords, newRecord]
      };
    });
  };

  // 특정 날짜의 감정 기록 가져오기
  const getDayEmotions = (date = currentDate) => {
    return emotionData[date] || [];
  };

  // 월간 감정 데이터 가져오기
  const getMonthEmotions = (year, month) => {
    const monthPrefix = `${year}-${month.toString().padStart(2, '0')}`;
    const monthData = {};
    
    Object.keys(emotionData).forEach(dateKey => {
      if (dateKey.startsWith(monthPrefix)) {
        monthData[dateKey] = emotionData[dateKey];
      }
    });
    
    return monthData;
  };

  // 날짜별 주요 감정 가져오기 (캘린더 표시용)
  const getDayPrimaryEmotion = (date) => {
    const dayData = emotionData[date] || [];
    if (dayData.length === 0) return null;
    
    // 감정별 시간 계산
    const emotionCounts = {};
    
    // 첫 번째 기록부터 마지막 기록까지의 시간 계산
    for (let i = 0; i < dayData.length; i++) {
      const record = dayData[i];
      const nextRecord = dayData[i + 1];
      
      const startTime = new Date(record.timestamp);
      const endTime = nextRecord 
        ? new Date(nextRecord.timestamp) 
        : new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate(), 23, 59, 59);
      
      const durationMs = endTime - startTime;
      
      emotionCounts[record.emotion] = (emotionCounts[record.emotion] || 0) + durationMs;
    }
    
    // 가장 오래 지속된 감정 찾기
    let primaryEmotion = null;
    let maxDuration = 0;
    
    Object.keys(emotionCounts).forEach(emotion => {
      if (emotionCounts[emotion] > maxDuration) {
        maxDuration = emotionCounts[emotion];
        primaryEmotion = emotion;
      }
    });
    
    return primaryEmotion;
  };

  return (
    <EmotionContext.Provider
      value={{
        emotionData,
        currentDate,
        setCurrentDate,
        addEmotionRecord,
        getDayEmotions,
        getMonthEmotions,
        getDayPrimaryEmotion,
        EMOTION_TYPES
      }}
    >
      {children}
    </EmotionContext.Provider>
  );
};

// 커스텀 훅
export const useEmotion = () => {
  const context = useContext(EmotionContext);
  if (!context) {
    throw new Error('useEmotion must be used within an EmotionProvider');
  }
  return context;
};