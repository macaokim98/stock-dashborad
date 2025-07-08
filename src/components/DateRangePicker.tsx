import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onDateRangeChange: (startDate: Date | null, endDate: Date | null) => void;
  className?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onDateRangeChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    onDateRangeChange(start, end);
  };

  const presetRanges = [
    {
      label: '7일',
      getDates: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 7);
        return [start, end];
      }
    },
    {
      label: '1개월',
      getDates: () => {
        const end = new Date();
        const start = new Date();
        start.setMonth(end.getMonth() - 1);
        return [start, end];
      }
    },
    {
      label: '3개월',
      getDates: () => {
        const end = new Date();
        const start = new Date();
        start.setMonth(end.getMonth() - 3);
        return [start, end];
      }
    },
    {
      label: '6개월',
      getDates: () => {
        const end = new Date();
        const start = new Date();
        start.setMonth(end.getMonth() - 6);
        return [start, end];
      }
    },
    {
      label: '1년',
      getDates: () => {
        const end = new Date();
        const start = new Date();
        start.setFullYear(end.getFullYear() - 1);
        return [start, end];
      }
    }
  ];

  const applyPreset = (getDates: () => Date[]) => {
    const [start, end] = getDates();
    onDateRangeChange(start, end);
  };

  const clearDates = () => {
    onDateRangeChange(null, null);
  };

  const formatDateRange = () => {
    if (!startDate && !endDate) {
      return '날짜 선택';
    }
    if (startDate && !endDate) {
      return startDate.toLocaleDateString('ko-KR');
    }
    if (startDate && endDate) {
      return `${startDate.toLocaleDateString('ko-KR')} ~ ${endDate.toLocaleDateString('ko-KR')}`;
    }
    return '날짜 선택';
  };

  return (
    <div className={`date-range-picker ${className}`}>
      <div className="date-input-container">
        <button 
          className="date-input-button"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="calendar-icon">📅</span>
          <span className="date-text">{formatDateRange()}</span>
          <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
        </button>
        
        {isOpen && (
          <div className="date-picker-dropdown">
            <div className="preset-buttons">
              <h4>빠른 선택</h4>
              <div className="preset-grid">
                {presetRanges.map((preset) => (
                  <button
                    key={preset.label}
                    className="preset-btn"
                    onClick={() => applyPreset(preset.getDates)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="calendar-section">
              <h4>사용자 정의</h4>
              <DatePicker
                selected={startDate}
                onChange={handleDateChange}
                startDate={startDate}
                endDate={endDate}
                selectsRange
                inline
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                maxDate={new Date()}
                dateFormat="yyyy-MM-dd"
                locale="ko"
              />
            </div>
            
            <div className="date-picker-actions">
              <button 
                className="action-btn clear-btn"
                onClick={clearDates}
              >
                초기화
              </button>
              <button 
                className="action-btn apply-btn"
                onClick={() => setIsOpen(false)}
                disabled={!startDate}
              >
                적용
              </button>
            </div>
          </div>
        )}
      </div>
      
      {isOpen && (
        <div 
          className="date-picker-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default DateRangePicker;