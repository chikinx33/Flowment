import React, { useState } from 'react';
import styled from 'styled-components';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { useEmotion } from '../context/EmotionContext';
import { useLanguage } from '../context/LanguageContext';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// 감정 아이콘 임포트
import joyIcon from '../assets/images/emotions/joy.svg';
import angerIcon from '../assets/images/emotions/anger.svg';
import sadnessIcon from '../assets/images/emotions/sadness.svg';
import pleasureIcon from '../assets/images/emotions/pleasure.svg';
import neutralIcon from '../assets/images/emotions/neutral.svg';

// Chart.js 등록
ChartJS.register(ArcElement, Tooltip, Legend);

const InsightsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid var(--border);
  margin-bottom: 1rem;
`;

const Tab = styled.button`
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  background: none;
  border: none;
  border-bottom: 2px solid ${props => props.active ? 'var(--accent)' : 'transparent'};
  color: ${props => props.active ? 'var(--accent)' : 'var(--text-secondary)'};
  font-weight: ${props => props.active ? '500' : 'normal'};
  transition: all 0.2s ease;
  
  &:hover {
    color: var(--accent);
  }
`;

const ChartContainer = styled.div`
  max-width: 300px;
  margin: 0 auto;
  padding: 1rem;
`;

const InsightCard = styled.div`
  background-color: #f5f5f5;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  
  h3 {
    font-size: 1.1rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }
  
  p {
    font-size: 0.9rem;
    color: var(--text-secondary);
    line-height: 1.6;
  }
`;

const EmotionStats = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
`;

const EmotionStat = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  .emotion-color {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background-color: ${props => props.color};
    display: none;
  }
  
  .emotion-icon {
    width: 24px;
    height: 24px;
    margin-right: 8px;
  }
  
  .emotion-label {
    font-size: 0.8rem;
  }
  
  .emotion-value {
    font-weight: 500;
    font-size: 0.8rem;
  }
`;

const InsightsPage = () => {
  const { emotionData, EMOTION_TYPES } = useEmotion();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('day');
  
  // 기간별 데이터 가져오기
  const getTimeRangeData = () => {
    const today = new Date();
    let startDate, endDate, title;
    
    switch (activeTab) {
      case 'day':
        startDate = format(today, 'yyyy-MM-dd');
        endDate = format(today, 'yyyy-MM-dd');
        title = t('insights.todayAnalysis');
        break;
      case 'week':
        startDate = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        endDate = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        title = t('insights.weekAnalysis');
        break;
      case 'month':
        startDate = format(startOfMonth(today), 'yyyy-MM-dd');
        endDate = format(endOfMonth(today), 'yyyy-MM-dd');
        title = t('insights.monthAnalysis');
        break;
      default:
        startDate = format(today, 'yyyy-MM-dd');
        endDate = format(today, 'yyyy-MM-dd');
        title = t('insights.todayAnalysis');
    }
    
    return { startDate, endDate, title };
  };
  
  // 감정 데이터 분석
  const analyzeEmotionData = () => {
    const { startDate, endDate } = getTimeRangeData();
    const emotionCounts = {};
    let totalRecords = 0;
    
    // 날짜 범위 내의 모든 기록 집계
    Object.keys(emotionData).forEach(dateKey => {
      if (dateKey >= startDate && dateKey <= endDate) {
        const dayRecords = emotionData[dateKey];
        
        dayRecords.forEach((record, index) => {
          const emotion = record.emotion;
          const nextRecord = dayRecords[index + 1];
          
          const startTime = new Date(record.timestamp);
          const endTime = nextRecord 
            ? new Date(nextRecord.timestamp) 
            : new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate(), 23, 59, 59);
          
          const durationMs = endTime - startTime;
          
          emotionCounts[emotion] = (emotionCounts[emotion] || 0) + durationMs;
          totalRecords += durationMs;
        });
      }
    });
    
    // 백분율 계산
    const emotionPercentages = {};
    Object.keys(emotionCounts).forEach(emotion => {
      emotionPercentages[emotion] = totalRecords > 0 
        ? Math.round((emotionCounts[emotion] / totalRecords) * 100) 
        : 0;
    });
    
    return { emotionCounts, emotionPercentages, totalRecords };
  };
  
  const { emotionPercentages, totalRecords } = analyzeEmotionData();
  const { title } = getTimeRangeData();
  
  // 차트 데이터 생성
  const chartData = {
    labels: Object.keys(emotionPercentages).map(emotion => {
      const emotionInfo = Object.values(EMOTION_TYPES).find(type => type.id === emotion);
      return emotionInfo ? t(`emotions.${emotion}`) : t('common.unknown');
    }),
    datasets: [
      {
        data: Object.values(emotionPercentages),
        backgroundColor: Object.keys(emotionPercentages).map(emotion => {
          const emotionInfo = Object.values(EMOTION_TYPES).find(type => type.id === emotion);
          return emotionInfo ? emotionInfo.color : '#9E9E9E';
        }),
        borderWidth: 0,
      },
    ],
  };
  
  const chartOptions = {
    plugins: {
      legend: {
        display: false,
      },
    },
    cutout: '70%',
  };
  
  // 인사이트 메시지 생성
  const generateInsight = () => {
    if (totalRecords === 0) {
      return t('insights.noDataMessage');
    }
    
    const dominantEmotion = Object.keys(emotionPercentages).reduce((a, b) => 
      emotionPercentages[a] > emotionPercentages[b] ? a : b, Object.keys(emotionPercentages)[0]);
    
    const emotionInfo = Object.values(EMOTION_TYPES).find(type => type.id === dominantEmotion);
    
    if (!emotionInfo) return t('insights.insufficientData');
    
    const percentage = emotionPercentages[dominantEmotion];
    
    let message = '';
    
    switch (dominantEmotion) {
      case 'joy':
        message = t('insights.joyInsight').replace('{percentage}', percentage);
        break;
      case 'anger':
        message = t('insights.angerInsight').replace('{percentage}', percentage);
        break;
      case 'sadness':
        message = t('insights.sadnessInsight').replace('{percentage}', percentage);
        break;
      case 'pleasure':
        message = t('insights.pleasureInsight').replace('{percentage}', percentage);
        break;
      case 'neutral':
        message = t('insights.neutralInsight').replace('{percentage}', percentage);
        break;
      default:
        message = t('insights.insufficientData');
    }
    
    return message;
  };
  
  return (
    <InsightsContainer>
      <TabContainer>
        <Tab 
          active={activeTab === 'day'} 
          onClick={() => setActiveTab('day')}
        >
          {t('common.today')}
        </Tab>
        <Tab 
          active={activeTab === 'week'} 
          onClick={() => setActiveTab('week')}
        >
          {t('common.thisWeek')}
        </Tab>
        <Tab 
          active={activeTab === 'month'} 
          onClick={() => setActiveTab('month')}
        >
          {t('common.thisMonth')}
        </Tab>
      </TabContainer>
      
      <h2>{title}</h2>
      
      {totalRecords > 0 ? (
        <>
          <ChartContainer>
            <Doughnut data={chartData} options={chartOptions} />
          </ChartContainer>
          
          <EmotionStats>
            {Object.keys(emotionPercentages).map(emotion => {
              const emotionInfo = Object.values(EMOTION_TYPES).find(type => type.id === emotion);
              if (!emotionInfo) return null;
              
              // 감정 ID에 따라 아이콘 선택
              let emotionIcon;
              switch(emotion) {
                case 'joy':
                  emotionIcon = joyIcon;
                  break;
                case 'anger':
                  emotionIcon = angerIcon;
                  break;
                case 'sadness':
                  emotionIcon = sadnessIcon;
                  break;
                case 'pleasure':
                  emotionIcon = pleasureIcon;
                  break;
                case 'neutral':
                  emotionIcon = neutralIcon;
                  break;
                default:
                  emotionIcon = neutralIcon;
              }
              
              return (
                <EmotionStat key={emotion} color={emotionInfo.color}>
                  <div className="emotion-color" />
                  <img src={emotionIcon} alt={emotionInfo.label} className="emotion-icon" />
                  <span className="emotion-label">{t(`emotions.${emotion}`)}</span>
                  <span className="emotion-value">{emotionPercentages[emotion]}%</span>
                </EmotionStat>
              );
            })}
          </EmotionStats>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <p>{t('common.noRecords')}</p>
        </div>
      )}
      
      <InsightCard>
        <h3>{t('insights.emotionInsight')}</h3>
        <p>{generateInsight()}</p>
      </InsightCard>
    </InsightsContainer>
  );
};

export default InsightsPage;