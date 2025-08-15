import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLanguage } from '../context/LanguageContext';
import titleImageEn from '../assets/images/title_en.png';
import titleImageKo from '../assets/images/title_kor.png';
import backgroundImage from '../assets/images/bg001.png';
import googleLogo from '../assets/images/google.png';

const LandingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  position: relative;
  overflow: hidden;
  text-align: center;
  background: linear-gradient(135deg, #B388FF, #7C4DFF);
  background-image: url(${backgroundImage});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  
  & > * {
    z-index: 1;
  }
  
  @media (min-width: 768px) {
    padding: 0;
  }
`;

const Logo = styled.img`
  width: 80%;
  max-width: 300px;
  height: auto;
  margin-bottom: 2rem;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: white;
  margin-bottom: 1rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const Description = styled.p`
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 2rem;
  width: 100%;
  padding: 0 1rem;
`;

const StartButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  color: #673AB7;
  border: none;
  border-radius: 50px;
  padding: 0.7rem 2rem;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  width: 220px;
  margin-bottom: 1rem;
  
  @media (min-width: 768px) {
    padding: 0.8rem 2rem;
    font-size: 1.1rem;
    width: 240px;
  }
  
  &:hover {
    background-color: #f5f5f5;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
  
  &:active {
    transform: translateY(1px);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }
`;

const LanguageSelector = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  align-items: center;
  
  @media (min-width: 768px) {
    top: 1rem;
    right: 1rem;
  }
`;

const LanguageButton = styled.button`
  background: ${props => props.active === 'true' ? 'rgba(255, 255, 255, 0.3)' : 'transparent'};
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 4px;
  padding: 0.3rem 0.6rem;
  margin-left: 0.3rem;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.2s;
  
  @media (min-width: 768px) {
    padding: 0.5rem 1rem;
    margin-left: 0.5rem;
    font-size: 1rem;
  }
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const GoogleLoginButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  color: #757575;
  border: none;
  border-radius: 50px;
  padding: 0.7rem 2rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  width: 220px;
  
  @media (min-width: 768px) {
    padding: 0.8rem 2rem;
    font-size: 1.1rem;
    width: 240px;
  }
  
  &:hover {
    background-color: #f5f5f5;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
  
  &:active {
    transform: translateY(1px);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }
`;

const LandingPage = () => {
  const navigate = useNavigate();
  const { language, translations, changeLanguage } = useLanguage();
  
  const handleStart = () => {
    navigate('/home');
  };
  
  return (
    <LandingContainer>
      <LanguageSelector>
        <LanguageButton 
          active={(language === 'ko').toString()} 
          onClick={() => changeLanguage('ko')}
        >
          한국어
        </LanguageButton>
        <LanguageButton 
          active={(language === 'en').toString()} 
          onClick={() => changeLanguage('en')}
        >
          English
        </LanguageButton>
      </LanguageSelector>
      
      <img src={language === 'ko' ? titleImageKo : titleImageEn} alt="Flowment Title" style={{ width: '55%', maxWidth: '330px', marginBottom: '8rem' }} />
      
      <StartButton onClick={handleStart}>
        {translations.landing.startButton}
      </StartButton>
      
      <GoogleLoginButton>
        <img src={googleLogo} alt="Google" width="18" height="18" style={{ marginRight: '8px' }} />
        {translations.landing.googleLogin}
      </GoogleLoginButton>
    </LandingContainer>
  );
};

export default LandingPage;