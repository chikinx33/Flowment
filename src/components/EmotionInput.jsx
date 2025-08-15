import { useState } from 'react';
import styled from 'styled-components';
import { useEmotion } from '../context/EmotionContext';

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
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  max-width: 420px;
  margin: 0 auto;
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
`;

const ModalContent = styled.div`
  background-color: white;
  border-radius: 16px;
  width: 92%;
  max-height: 85vh;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  -webkit-overflow-scrolling: touch; /* 모바일에서 부드러운 스크롤 */
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  
  h2 {
    font-size: 1.3rem;
    font-weight: 600;
  }
  
  button {
    background: none;
    border: none;
    font-size: 1.8rem;
    cursor: pointer;
    color: var(--text-secondary);
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: -0.5rem;
    border-radius: 50%;
    
    &:active {
      background-color: rgba(0, 0, 0, 0.05);
    }
  }
`;

const EmotionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
`;

const EmotionButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.2rem 0.8rem;
  border-radius: 12px;
  border: 2px solid ${props => props.selected ? props.color : 'transparent'};
  background-color: ${props => props.selected ? `${props.color}20` : '#f5f5f5'};
  transition: all 0.2s ease;
  position: relative;
  
  &:hover {
    background-color: ${props => `${props.color}10`};
  }
  
  &:active {
    transform: scale(0.98);
  }
  
  .emotion-icon {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .emotion-label {
    font-size: 0.9rem;
    font-weight: ${props => props.selected ? '500' : 'normal'};
  }
  
  /* 터치 영역 확장 */
  &::before {
    content: '';
    position: absolute;
    top: -5px;
    left: -5px;
    right: -5px;
    bottom: -5px;
    z-index: -1;
  }
`;

const MemoInput = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  resize: none;
  font-family: inherit;
  font-size: 1rem;
  line-height: 1.5;
  -webkit-appearance: none; /* iOS에서 기본 스타일 제거 */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  
  &:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.1);
  }
  
  &:focus {
    outline: none;
    border-color: var(--accent);
  }
`;

const ImageUploadContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ImageUploadLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  color: var(--accent);
  cursor: pointer;
  font-size: 1rem;
  padding: 0.8rem;
  border-radius: 8px;
  border: 1px dashed var(--accent);
  background-color: rgba(74, 144, 226, 0.05);
  transition: all 0.2s ease;
  
  &:active {
    background-color: rgba(74, 144, 226, 0.1);
  }
  
  svg {
    width: 24px;
    height: 24px;
  }
`;

const ImagePreview = styled.div`
  position: relative;
  margin-top: 0.5rem;
  
  img {
    width: 100%;
    max-height: 200px;
    object-fit: cover;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  button {
    position: absolute;
    top: 8px;
    right: 8px;
    background-color: rgba(0, 0, 0, 0.6);
    color: white;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    
    &:active {
      background-color: rgba(0, 0, 0, 0.8);
      transform: scale(0.95);
    }
  }
`;

const SubmitButton = styled.button`
  background-color: var(--accent);
  color: white;
  padding: 1rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1.1rem;
  width: 100%;
  transition: all 0.2s ease;
  position: relative;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
    box-shadow: none;
  }
  
  &:hover:not(:disabled) {
    background-color: #3a7bc8;
  }
  
  &:active:not(:disabled) {
    transform: translateY(2px);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  /* 터치 영역 확장 */
  &::before {
    content: '';
    position: absolute;
    top: -10px;
    left: -10px;
    right: -10px;
    bottom: -10px;
    z-index: -1;
  }
`;

const EmotionInput = ({ onClose }) => {
  const { EMOTION_TYPES, addEmotionRecord } = useEmotion();
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [memo, setMemo] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = () => {
    if (!selectedEmotion) return;
    
    addEmotionRecord(selectedEmotion, memo, imagePreview);
    onClose();
  };
  
  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h2>감정 기록하기</h2>
          <button onClick={onClose}>&times;</button>
        </ModalHeader>
        
        <div>
          <h3>지금 느끼는 감정은?</h3>
          <EmotionGrid>
            {Object.values(EMOTION_TYPES).map((emotion) => (
              <EmotionButton
                key={emotion.id}
                color={emotion.color}
                selected={selectedEmotion === emotion.id}
                onClick={() => setSelectedEmotion(emotion.id)}
              >
                <div className="emotion-icon">
                  <img 
                    src={
                      emotion.id === 'joy' ? joyIcon :
                      emotion.id === 'anger' ? angerIcon :
                      emotion.id === 'sadness' ? sadnessIcon :
                      emotion.id === 'pleasure' ? pleasureIcon :
                      neutralIcon
                    } 
                    alt={emotion.label} 
                    width="40" 
                    height="40" 
                  />
                </div>
                <span className="emotion-label">{emotion.label}</span>
              </EmotionButton>
            ))}
          </EmotionGrid>
        </div>
        
        <div>
          <h3>메모</h3>
          <MemoInput
            placeholder="지금 무슨 일이 있었나요?"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>
        
        <ImageUploadContainer>
          <ImageUploadLabel>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            사진 추가하기
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageChange}
            />
          </ImageUploadLabel>
          
          {imagePreview && (
            <ImagePreview>
              <img src={imagePreview} alt="미리보기" />
              <button onClick={() => {
                setImage(null);
                setImagePreview(null);
              }}>
                &times;
              </button>
            </ImagePreview>
          )}
        </ImageUploadContainer>
        
        <SubmitButton
          disabled={!selectedEmotion}
          onClick={handleSubmit}
        >
          기록하기
        </SubmitButton>
      </ModalContent>
    </ModalOverlay>
  );
};

export default EmotionInput;