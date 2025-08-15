import { useState } from 'react';
import styled from 'styled-components';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useEmotion } from '../context/EmotionContext';
import { useLanguage } from '../context/LanguageContext';
import DayDetail from '../components/DayDetail';

// 감정 아이콘 가져오기
import joyIcon from '../assets/images/emotions/joy.svg';
import angerIcon from '../assets/images/emotions/anger.svg';
import sadnessIcon from '../assets/images/emotions/sadness.svg';
import pleasureIcon from '../assets/images/emotions/pleasure.svg';
import neutralIcon from '../assets/images/emotions/neutral.svg';

const CalendarContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const MonthSelector = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  
  h2 {
    font-size: 1.2rem;
    font-weight: 500;
  }
  
  .controls {
    display: flex;
    gap: 0.5rem;
  }
  
  button {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
      background-color: #e0e0e0;
    }
  }
`;

const WeekdayHeader = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-weight: 500;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
  
  .weekend {
    color: var(--emotion-anger);
  }
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
`;

const DayCell = styled.div`
  aspect-ratio: 1;
  padding: 0.25rem;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: ${props => props.isCurrentMonth ? 'pointer' : 'default'};
  opacity: ${props => props.isCurrentMonth ? 1 : 0.3};
  position: relative;
  
  &:hover {
    background-color: ${props => props.isCurrentMonth ? '#f5f5f5' : 'transparent'};
  }
  
  .day-number {
    font-size: 0.9rem;
    font-weight: ${props => props.isToday ? 'bold' : 'normal'};
    z-index: 1;
  }
  
  .emotion-indicator {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 8px;
    background-color: ${props => props.emotionColor ? `${props.emotionColor}40` : 'transparent'};
    z-index: 0;
  }
  
  .emotion-icon {
    width: 20px;
    height: 20px;
    margin-top: 2px;
    z-index: 1;
  }
  
  ${props => props.isToday && `
    &::after {
      content: '';
      position: absolute;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid var(--accent);
      z-index: 0;
    }
  `}
`;

const CalendarPage = () => {
  const { EMOTION_TYPES, getDayPrimaryEmotion } = useEmotion();
  const { t } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  
  // 월 변경 핸들러
  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  
  // 현재 월의 모든 날짜 가져오기
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // 달력 그리드 시작일 (이전 달의 일부 포함)
  const startDay = getDay(monthStart);
  
  // 요일 헤더
  const weekdays = [
    t('calendar.weekdays.sunday'),
    t('calendar.weekdays.monday'),
    t('calendar.weekdays.tuesday'),
    t('calendar.weekdays.wednesday'),
    t('calendar.weekdays.thursday'),
    t('calendar.weekdays.friday'),
    t('calendar.weekdays.saturday')
  ];
  
  // 감정 색상 가져오기
  const getEmotionColor = (emotionId) => {
    if (!emotionId) return null;
    const emotion = Object.values(EMOTION_TYPES).find(e => e.id === emotionId);
    return emotion ? emotion.color : null;
  };
  
  // 오늘 날짜
  const today = format(new Date(), 'yyyy-MM-dd');
  
  return (
    <CalendarContainer>
      <MonthSelector>
        <h2>{format(currentMonth, 'yyyy년 M월', { locale: ko })}</h2>
        <div className="controls">
          <button onClick={handlePrevMonth}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <button onClick={handleNextMonth}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </MonthSelector>
      
      <WeekdayHeader>
        {weekdays.map((day, index) => (
          <div key={day} className={index === 0 || index === 6 ? 'weekend' : ''}>
            {day}
          </div>
        ))}
      </WeekdayHeader>
      
      <CalendarGrid>
        {/* 이전 달의 날짜로 빈 셀 채우기 */}
        {Array.from({ length: startDay }).map((_, index) => (
          <DayCell key={`empty-${index}`} isCurrentMonth={false} />
        ))}
        
        {/* 현재 달의 날짜 */}
        {monthDays.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const primaryEmotion = getDayPrimaryEmotion(dateStr);
          const emotionColor = getEmotionColor(primaryEmotion);
          const isToday = dateStr === today;
          
          return (
            <DayCell 
              key={dateStr}
              isCurrentMonth={true}
              isToday={isToday}
              emotionColor={emotionColor}
              onClick={() => setSelectedDate(dateStr)}
            >
              <div className="emotion-indicator" />
              <span className="day-number">{format(day, 'd')}</span>
              {primaryEmotion && (
                <img 
                  className="emotion-icon"
                  src={
                    primaryEmotion === 'joy' ? joyIcon :
                    primaryEmotion === 'anger' ? angerIcon :
                    primaryEmotion === 'sadness' ? sadnessIcon :
                    primaryEmotion === 'pleasure' ? pleasureIcon :
                    neutralIcon
                  } 
                  alt={t('calendar.emotionIcon')} 
                />  
              )}
            </DayCell>
          );
        })}
      </CalendarGrid>
      
      {selectedDate && (
        <DayDetail 
          date={selectedDate} 
          onClose={() => setSelectedDate(null)} 
        />
      )}
    </CalendarContainer>
  );
};

export default CalendarPage;