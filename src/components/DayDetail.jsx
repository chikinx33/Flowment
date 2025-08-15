import styled from 'styled-components';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useEmotion } from '../context/EmotionContext';
import { useLanguage } from '../context/LanguageContext';
import EmotionTimeline from './EmotionTimeline';

// 감정 아이콘 가져오기
import joyIcon from '../assets/images/emotions/joy.svg';
import angerIcon from '../assets/images/emotions/anger.svg';
import sadnessIcon from '../assets/images/emotions/sadness.svg';
import pleasureIcon from '../assets/images/emotions/pleasure.svg';
import neutralIcon from '../assets/images/emotions/neutral.svg';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  max-width: 420px;
  margin: 0 auto;
`;

const ModalContent = styled.div`
  background-color: white;
  border-radius: 12px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h2 {
    font-size: 1.2rem;
    font-weight: 500;
  }
  
  button {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-secondary);
  }
`;

const EmotionSummary = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 8px;
`;

const EmotionIcon = styled.div`
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const EmotionInfo = styled.div`
  flex: 1;
  
  .emotion-label {
    font-weight: 500;
    color: ${props => props.color || 'var(--text-primary)'};
    margin-bottom: 0.25rem;
  }
  
  .emotion-stats {
    font-size: 0.8rem;
    color: var(--text-secondary);
  }
`;

const DayDetail = ({ date, onClose }) => {
  const { getDayEmotions, EMOTION_TYPES } = useEmotion();
  const { t } = useLanguage();
  const emotions = getDayEmotions(date);
  
  // 주요 감정 계산 (가장 오래 지속된 감정)
  const calculatePrimaryEmotion = () => {
    if (emotions.length === 0) return null;
    
    const emotionDurations = {};
    
    for (let i = 0; i < emotions.length; i++) {
      const record = emotions[i];
      const nextRecord = emotions[i + 1];
      
      const startTime = new Date(record.timestamp);
      const endTime = nextRecord 
        ? new Date(nextRecord.timestamp) 
        : new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate(), 23, 59, 59);
      
      const durationMs = endTime - startTime;
      
      emotionDurations[record.emotion] = (emotionDurations[record.emotion] || 0) + durationMs;
    }
    
    let primaryEmotion = null;
    let maxDuration = 0;
    
    Object.keys(emotionDurations).forEach(emotion => {
      if (emotionDurations[emotion] > maxDuration) {
        maxDuration = emotionDurations[emotion];
        primaryEmotion = emotion;
      }
    });
    
    return {
      emotion: primaryEmotion,
      duration: maxDuration,
      percentage: Math.round((maxDuration / (24 * 60 * 60 * 1000)) * 100)
    };
  };
  
  const primaryEmotionData = calculatePrimaryEmotion();
  
  // 감정 정보 가져오기
  const getEmotionInfo = (emotionId) => {
    if (!emotionId) return { label: t('common.noRecord'), color: '#9E9E9E' };
    return Object.values(EMOTION_TYPES).find(type => type.id === emotionId) || 
           { label: t('common.unknown'), color: '#9E9E9E' };
  };
  
  const primaryEmotionInfo = getEmotionInfo(primaryEmotionData?.emotion);
  
  // 시간 포맷팅 (밀리초 -> 시간:분)
  const formatDuration = (ms) => {
    if (!ms) return `0${t('common.hours')} 0${t('common.minutes')}`;
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}${t('common.hours')} ${minutes}${t('common.minutes')}`;
  };
  
  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h2>{format(new Date(date), 'yyyy년 M월 d일 (E)', { locale: ko })}</h2>
          <button onClick={onClose}>&times;</button>
        </ModalHeader>
        
        {emotions.length > 0 ? (
          <>
            <EmotionSummary>
              <EmotionIcon>
                <img 
                  src={
                    primaryEmotionInfo.id === 'joy' ? joyIcon :
                    primaryEmotionInfo.id === 'anger' ? angerIcon :
                    primaryEmotionInfo.id === 'sadness' ? sadnessIcon :
                    primaryEmotionInfo.id === 'pleasure' ? pleasureIcon :
                    neutralIcon
                  } 
                  alt={primaryEmotionInfo.label} 
                  width="48" 
                  height="48" 
                />
              </EmotionIcon>
              <EmotionInfo color={primaryEmotionInfo.color}>
                <div className="emotion-label">{t(`emotions.${primaryEmotionData?.emotion}`)}</div>
                <div className="emotion-stats">
                  {t('common.primaryEmotion')} · {formatDuration(primaryEmotionData?.duration)} · {primaryEmotionData?.percentage}%
                </div>
              </EmotionInfo>
            </EmotionSummary>
            
            <div>
              <h3>{t('common.emotionTimeline')}</h3>
              <EmotionTimeline emotions={emotions} />
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <p>{t('common.noRecordsForDay')}</p>
          </div>
        )}
      </ModalContent>
    </ModalOverlay>
  );
};

export default DayDetail;