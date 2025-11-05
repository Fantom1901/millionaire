import React from 'react';
import styles from './PrizeLadder.module.scss';

const PRIZES = [
  {"level": 1, "prize": "500", "safe": false},
  {"level": 2, "prize": "1 000", "safe": false},
  {"level": 3, "prize": "2 000", "safe": false},
  {"level": 4, "prize": "3 000", "safe": false},
  {"level": 5, "prize": "5 000", "safe": true},
  {"level": 6, "prize": "10 000", "safe": false},
  {"level": 7, "prize": "15 000", "safe": false},
  {"level": 8, "prize": "25 000", "safe": false},
  {"level": 9, "prize": "50 000", "safe": false},
  {"level": 10, "prize": "100 000", "safe": true},
  {"level": 11, "prize": "200 000", "safe": false},
  {"level": 12, "prize": "400 000", "safe": false},
  {"level": 13, "prize": "800 000", "safe": false},
  {"level": 14, "prize": "1 500 000", "safe": false},
  {"level": 15, "prize": "3 000 000", "safe": true},
];

const PrizeLadder = ({currentLevel}) => {
  const reversedPrizes = [...PRIZES].reverse();

  return (
    <div className={styles.ladder}>
      <div className={styles.ladderTitle}>Таблица выигрышей</div>
      {reversedPrizes.map((prize) => (
        <div
          key={prize.level}
          className={`${styles.ladderItem} 
                        ${prize.safe ? styles.safe : ''} 
                        ${prize.level === currentLevel ? styles.active : ''} 
                        ${prize.level < currentLevel ? styles.passed : ''}`
          }
        >
          <span className={styles.level}>{prize.level}</span>
          <span className={styles.prize}>{prize.prize} ₽</span>
        </div>
      ))}
    </div>
  );
};

export default PrizeLadder;