import React, {useState} from 'react';
import PrizeLadder from './components/PrizeLadder';
import styles from './App.module.scss';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [gameState, setGameState] = useState({
    currentQuestion: null,
    currentLevel: 0,
    lifelines: ["50/50", "phone"],
    status: 'initial'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("Нажмите 'Начать игру' для старта.");

  const startGame = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/start`, {method: 'POST'});
      const data = await response.json();

      if (data.status === 'started') {
        setGameState({
          currentQuestion: data.question,
          currentLevel: 1,
          lifelines: data.lifelines,
          status: 'playing'
        });
        setMessage(`Уровень 1. Приз: ${data.question.prize} ₽`);
      } else {
        setMessage(`Ошибка: ${data.message}`);
      }
    } catch (error) {
      console.error("Ошибка при старте игры:", error);
      setMessage("Ошибка подключения к серверу Python. Проверьте, запущен ли он на порту 5000.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = async (index) => {
    if (gameState.status !== 'playing') return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/answer`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({answer_index: index})
      });
      const data = await response.json();

      if (data.status === 'correct') {
        setGameState(prev => ({
          ...prev,
          currentQuestion: data.next_question,
          currentLevel: data.current_level,
          status: 'playing'
        }));
        setMessage(`Верно! Следующий вопрос на ${data.next_question.prize} ₽`);
      } else if (data.status === 'wrong') {
        setGameState(prev => ({...prev, status: 'wrong'}));
        setMessage(`Вы проиграли. ${data.message}. Ваш несгораемый выигрыш: ${data.final_prize} ₽`);
      } else if (data.status === 'win') {
        setGameState(prev => ({...prev, status: 'win'}));
        setMessage(`ПОБЕДА! Вы выиграли ${data.final_prize} ₽!`);
      }

    } catch (error) {
      console.error("Ошибка при отправке ответа:", error);
      setMessage("Ошибка сети при проверке ответа.");
    } finally {
      setIsLoading(false);
    }
  };

  const handle5050 = async () => {
    if (!gameState.lifelines.includes("50/50")) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/lifeline`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({type: '50/50'})
      });
      const data = await response.json();

      if (data.status === 'success') {
        const optionsToKeep = data.options_to_keep;

        const newOptions = gameState.currentQuestion.options.map((opt, index) =>
          optionsToKeep.includes(index) ? opt : null
        );

        setGameState(prev => ({
          ...prev,
          currentQuestion: {...prev.currentQuestion, options: newOptions},
          lifelines: prev.lifelines.filter(line => line !== '50/50')
        }));
        setMessage("Подсказка 50/50 использована. Два неверных варианта удалены.");
      } else {
        setMessage(`Ошибка подсказки: ${data.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };


  const renderGameContent = () => {
    if (gameState.status !== 'playing' || !gameState.currentQuestion) {
      return (
        <div className={styles.startScreen}>
          <h2>{message}</h2>
          <button
            className={styles.startButton}
            onClick={startGame}
            disabled={isLoading}
          >
            {gameState.status === 'initial' ? "Начать игру" : "Играть снова"}
          </button>
        </div>
      );
    }

    const q = gameState.currentQuestion;

    return (
      <div className={styles.questionContainer}>
        <div className={styles.lifelines}>
          <button
            onClick={handle5050}
            disabled={isLoading || !gameState.lifelines.includes("50/50")}
            className={`${styles.lifelineButton} ${!gameState.lifelines.includes("50/50") ? styles.used : ''}`}
          >
            50/50
          </button>
        </div>

        <div className={styles.questionBox}>
          <p>{q.question}</p>
        </div>

        <div className={styles.answersGrid}>
          {q.options.map((option, index) => (
            <button
              key={index}
              className={`${styles.answerButton} ${option === null ? styles.disabledOption : ''}`}
              onClick={() => handleAnswer(index)}
              disabled={isLoading || option === null}
            >
              {`${String.fromCharCode(65 + index)}: ${option || '...'}`}
            </button>
          ))}
        </div>
      </div>
    );
  };


  return (
    <div className={styles.gameContainer}>

      <div className={styles.ladderArea}>
        <PrizeLadder currentLevel={gameState.currentLevel} />
      </div>

      <div className={styles.gameArea}>
        <h1 className={styles.gameTitle}>Кто хочет стать миллионером?</h1>
        {renderGameContent()}
      </div>

    </div>
  );
}

export default App;