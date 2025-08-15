import styled from 'styled-components';
import { format } from 'date-fns';
import { useEmotion } from '../context/EmotionContext';
import { useLanguage } from '../context/LanguageContext';

// 감정 아이콘 가져오기
import joyIcon from '../assets/images/emotions/Icon_H.png';
import angerIcon from '../assets/images/emotions/Icon_A.png';
import sadnessIcon from '../assets/images/emotions/Icon_S.png';
import pleasureIcon from '../assets/images/emotions/Icon_J.png';
import neutralIcon from '../assets/images/emotions/Icon_N.png';

const TimelineContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
  
  h3 {
    margin-bottom: 0.5rem;
  }
  
  p {
    font-size: 0.9rem;
    padding-bottom: 0.8rem;
    border-bottom: 1px solid var(--border);
    display: block;
    width: 100%;
    margin-bottom: 0;
  }
`;

const TimelineItem = styled.div`
  display: flex;
  gap: 1rem;
`;

const TimeColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 70px;
`;

const TimeMarker = styled.div`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const TimeLine = styled.div`
  flex: 1;
  width: 2px;
  background-color: ${props => props.color || 'var(--emotion-neutral)'};
  margin: 8px 0;
`;

const TimeText = styled.span`
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 4px;
`;

const ContentColumn = styled.div`
  flex: 1;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 1rem;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    left: -8px;
    top: 12px;
    width: 0;
    height: 0;
    border-top: 8px solid transparent;
    border-bottom: 8px solid transparent;
    border-right: 8px solid #f5f5f5;
  }
`;

const EmotionLabel = styled.div`
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: ${props => props.color || 'var(--text-primary)'};
`;

const EmotionMemo = styled.p`
  font-size: 0.9rem;
  white-space: pre-wrap;
`;

const EmotionImage = styled.img`
  width: 100%;
  border-radius: 4px;
  margin-top: 0.5rem;
  max-height: 200px;
  object-fit: cover;
`;

const EmotionTimeline = ({ emotions }) => {
  const { EMOTION_TYPES } = useEmotion();
  const { translations, language } = useLanguage();
  
  if (!emotions || emotions.length === 0) {
    return (
      <EmptyState>
        <h3>{translations.common.today}</h3>
        <p>{format(new Date(), language === 'ko' ? 'yyyy년 MM월 dd일' : 'MMMM d, yyyy')}</p>
      </EmptyState>
    );
  }
  
  // 감정 타입에 따른 색상 및 라벨 가져오기
  const getEmotionInfo = (emotionId) => {
    const emotionType = Object.values(EMOTION_TYPES).find(type => type.id === emotionId);
    return emotionType || { label: '알 수 없음', color: '#9E9E9E' };
  };
  
  return (
    <TimelineContainer>
      {emotions.map((item, index) => {
        const emotionInfo = getEmotionInfo(item.emotion);
        const time = format(new Date(item.timestamp), 'HH:mm');
        const isLast = index === emotions.length - 1;
        
        return (
          <TimelineItem key={item.id}>
            <TimeColumn>
              <TimeMarker>
                <img 
                  src={
                    emotionInfo.id === 'joy' ? joyIcon :
                    emotionInfo.id === 'anger' ? angerIcon :
                    emotionInfo.id === 'sadness' ? sadnessIcon :
                    emotionInfo.id === 'pleasure' ? pleasureIcon :
                    neutralIcon
                  } 
                  alt={emotionInfo.label} 
                  width="32" 
                  height="32" 
                  style={{ objectFit: 'contain' }}
                />
              </TimeMarker>
              {!isLast && <TimeLine color={emotionInfo.color} />}
              <TimeText>{time}</TimeText>
            </TimeColumn>
            
            <ContentColumn>
              <EmotionLabel color={emotionInfo.color}>
                {emotionInfo.label}
              </EmotionLabel>
              {item.memo && <EmotionMemo>{item.memo}</EmotionMemo>}
              {item.imageUrl && <EmotionImage src={item.imageUrl} alt="감정 이미지" />}
            </ContentColumn>
          </TimelineItem>
        );
      })}
    </TimelineContainer>
  );
};

export default EmotionTimeline;