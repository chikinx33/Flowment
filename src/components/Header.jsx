import styled from 'styled-components';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import logoTop1 from '../assets/images/logo top1.png';
import logoTop2 from '../assets/images/logo top2.png';

const HeaderContainer = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0;
  background-color: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
  width: 100%;
`;

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  
  span {
    font-weight: 300;
    font-size: 0.9rem;
    color: var(--text-secondary);
    display: block;
  }
`;

const PageTitle = styled.h1`
  font-size: 1.2rem;
  font-weight: 500;
  text-align: center;
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  overflow: hidden;
  position: relative;
  height: 100px;
  
  img {
    width: 420px;
    max-width: 100%;
    height: auto;
    object-fit: cover;
    position: absolute;
    top: -100px;
  }
`;

const Header = () => {
  const location = useLocation();
  const { translations } = useLanguage();
  
  // 현재 경로에 따라 페이지 제목 설정
  const getPageTitle = () => {
    switch(location.pathname) {
      case '/home':
        return translations.common.emotionTimeline;
      case '/home/calendar':
        return translations.common.calendar;
      case '/home/insights':
        return translations.common.insights;
      default:
        return '';
    }
  };

  // 현재 경로에 따라 적절한 로고 이미지 반환
  const getLogoImage = () => {
    switch(location.pathname) {
      case '/home':
        return logoTop1;
      case '/home/calendar':
        return logoTop2;
      default:
        return null;
    }
  };

  return (
    <HeaderContainer>
      {location.pathname === '/' ? (
        <Logo>
          Flowment
          <span>Our moments in flow...</span>
        </Logo>
      ) : (
        <PageTitle>
          {getLogoImage() ? (
            <img src={getLogoImage()} alt={getPageTitle()} />
          ) : (
            getPageTitle()
          )}
        </PageTitle>
      )}
    </HeaderContainer>
  );
};

export default Header;