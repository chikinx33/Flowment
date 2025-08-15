import { useState } from 'react';
import styled from 'styled-components';
import { useEmotion } from '../context/EmotionContext';
import EmotionTimeline from '../components/EmotionTimeline';
import EmotionInput from '../components/EmotionInput';

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const AddEmotionButton = styled.button`
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: var(--accent);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 5;
  
  svg {
    width: 24px;
    height: 24px;
  }
`;

const HomePage = () => {
  const { currentDate, getDayEmotions } = useEmotion();
  const [showEmotionInput, setShowEmotionInput] = useState(false);
  
  const todayEmotions = getDayEmotions(currentDate);
  
  return (
    <HomeContainer>
      <EmotionTimeline emotions={todayEmotions} />
      
      <AddEmotionButton onClick={() => setShowEmotionInput(true)}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </AddEmotionButton>
      
      {showEmotionInput && (
        <EmotionInput onClose={() => setShowEmotionInput(false)} />
      )}
    </HomeContainer>
  );
};

export default HomePage;