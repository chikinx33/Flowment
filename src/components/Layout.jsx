import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import styled from 'styled-components';

const LayoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 420px;
  margin: 0 auto;
  position: relative;
  overflow: hidden;
`;

const MainContent = styled.main`
  flex: 1;
  padding: 1rem;
  padding-bottom: 70px; /* 하단 네비게이션 높이만큼 여백 */
  overflow-y: auto;
  position: relative;
  z-index: 1;
  -webkit-overflow-scrolling: touch; /* 모바일에서 부드러운 스크롤 */
`;

const Layout = () => {
  return (
    <LayoutContainer>
      <Header />
      <MainContent>
        <Outlet />
      </MainContent>
      <BottomNav />
    </LayoutContainer>
  );
};

export default Layout;