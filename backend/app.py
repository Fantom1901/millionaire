import json
import random
import os
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

QUESTIONS_FILE = 'questions.json'

PRIZE_LADDER = [
    {"level": 1, "prize": 500, "safe": False},
    {"level": 2, "prize": 1000, "safe": False},
    {"level": 3, "prize": 2000, "safe": False},
    {"level": 4, "prize": 3000, "safe": False},
    {"level": 5, "prize": 5000, "safe": True},    
    {"level": 6, "prize": 10000, "safe": False},
    {"level": 7, "prize": 15000, "safe": False},
    {"level": 8, "prize": 25000, "safe": False},
    {"level": 9, "prize": 50000, "safe": False},
    {"level": 10, "prize": 100000, "safe": True},  
    {"level": 11, "prize": 200000, "safe": False},
    {"level": 12, "prize": 400000, "safe": False},
    {"level": 13, "prize": 800000, "safe": False},
    {"level": 14, "prize": 1500000, "safe": False},
    {"level": 15, "prize": 3000000, "safe": True}, 
]

ALL_QUESTIONS = [] 

def load_questions():
    global ALL_QUESTIONS
    try:
        file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), QUESTIONS_FILE)
        
        with open(file_path, 'r', encoding='utf-8') as f:
            ALL_QUESTIONS = json.load(f)
        
        if not ALL_QUESTIONS or len(ALL_QUESTIONS) < 15:
            raise ValueError(f"Файл вопросов пуст или содержит менее 15 вопросов ({len(ALL_QUESTIONS)}).")
            
    except Exception as e:
        print(f"\n[КРИТИЧЕСКАЯ ОШИБКА] Не удалось загрузить вопросы из {QUESTIONS_FILE}. Сервер остановлен. Причина: {e}")
        raise 

game_state = {
    'current_question_index': 0,
    'lifelines': ["50/50", "phone"],
    'questions': [] 
}

def reset_game():
    game_state['questions'] = ALL_QUESTIONS
    game_state['current_question_index'] = 1 
    game_state['lifelines'] = ["50/50", "phone"]

def get_current_question():
    current_index = game_state['current_question_index']
    
    if 1 <= current_index <= len(game_state['questions']):
        return game_state['questions'][current_index - 1]
    return None

def find_safe_prize(level_index):
    safe_prize = 0
    for prize_data in PRIZE_LADDER:
        if prize_data['level'] < level_index and prize_data['safe']:
            safe_prize = prize_data['prize']
    return safe_prize


@app.route('/api/start', methods=['POST'])
def start_game():
    reset_game()
    current_q = get_current_question()
    
    if not current_q:
        return jsonify({"status": "error", "message": "Нет доступных вопросов"}), 500

    response_q = {
        "id": current_q["id"],
        "question": current_q["question"],
        "options": current_q["options"],
        "prize": current_q["prize"]
    }
    
    return jsonify({
        "status": "started",
        "question": response_q,
        "lifelines": game_state['lifelines']
    })

@app.route('/api/answer', methods=['POST'])
def check_answer():
    data = request.get_json()
    user_answer_index = data.get('answer_index')

    current_q = get_current_question()
    
    if not current_q:
        return jsonify({"status": "game_over", "message": "Игра окончена, вопросов больше нет"}), 200

    correct_index = current_q['correct_index']

    if user_answer_index == correct_index:
        
        game_state['current_question_index'] += 1
        
        next_q = get_current_question()
        
        if next_q:
            response_q = {
                "id": next_q["id"],
                "question": next_q["question"],
                "options": next_q["options"],
                "prize": next_q["prize"]
            }
            return jsonify({
                "status": "correct",
                "message": f"Верно! Ваш выигрыш: {current_q['prize']} ₽",
                "next_question": response_q,
                "current_level": game_state['current_question_index']
            })
        else:
            final_prize_amount = PRIZE_LADDER[-1]["prize"]
            return jsonify({
                "status": "win", 
                "final_prize": final_prize_amount
            })

    else:
        incorrect_level = game_state['current_question_index']
        safe_prize = find_safe_prize(incorrect_level)

        game_state['current_question_index'] = 0
        
        return jsonify({
            "status": "wrong",
            "message": f"Неверно. Правильный ответ: {current_q['options'][correct_index]}",
            "final_prize": safe_prize
        })

@app.route('/api/lifeline', methods=['POST'])
def use_lifeline():
    data = request.get_json()
    lifeline_type = data.get('type')
    
    if lifeline_type not in game_state['lifelines']:
        return jsonify({"status": "error", "message": f"Подсказка '{lifeline_type}' уже использована."}), 400

    current_q = get_current_question()
    if not current_q:
        return jsonify({"status": "error", "message": "Нет активного вопроса."}), 400
        
    game_state['lifelines'].remove(lifeline_type)
    
    if lifeline_type == "50/50":
        correct_index = current_q['correct_index']
        wrong_indices = [i for i in range(len(current_q['options'])) if i != correct_index]
        
        one_wrong_to_keep = random.choice(wrong_indices)
        options_to_keep = sorted([correct_index, one_wrong_to_keep])
        
        return jsonify({
            "status": "success",
            "type": "50/50",
            "options_to_keep": options_to_keep,
            "lifelines": game_state['lifelines']
        })
    
    return jsonify({"status": "error", "message": "Неизвестный тип подсказки."}), 400


if __name__ == '__main__':
    try:
        load_questions() 
    except Exception:
        exit(1)

    reset_game()
    print("----------------------------------------------------------------------")
    print(f" PYTHON BACKEND (Flask) УСПЕШНО ЗАГРУЖЕН. Вопросов: {len(ALL_QUESTIONS)}")
    print(" * Running on http://127.0.0.1:5000")
    print("----------------------------------------------------------------------")
    app.run(debug=True)

