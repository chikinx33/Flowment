import { NavLink } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import styled from 'styled-components';

const NavContainer = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 420px;
  margin: 0 auto;
  background-color: #fff;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: space-around;
  padding: 0.5rem 0;
  z-index: 10;
`;

const NavItem = styled(NavLink)`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.7rem 0.5rem;
  color: var(--text-secondary);
  font-size: 0.75rem;
  min-width: 60px;
  position: relative;
  
  &.active {
    color: var(--accent);
  }
  
  &.active::after {
    content: '';
    position: absolute;
    bottom: -0.5rem;
    width: 40%;
    height: 3px;
    background-color: var(--accent);
    border-radius: 3px;
  }
  
  svg {
    margin-bottom: 0.25rem;
    font-size: 1.5rem;
  }
  
  /* 터치 영역 확장을 위한 가상 요소 */
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

const BottomNav = () => {
  const { translations } = useLanguage();
  
  return (
    <NavContainer>
      <NavItem to="/home" end>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
        {translations.common.timeline}
      </NavItem>
      
      <NavItem to="/home/calendar">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        {translations.common.calendar}
      </NavItem>
      
      <NavItem to="/home/insights">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
        </svg>
        {translations.common.insights}
      </NavItem>
    </NavContainer>
  );
};

export default BottomNav;