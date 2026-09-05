"""
The list of security questions an artisan can choose from when
registering. Kept in ONE place on the backend so the register screen and
the forgot-password screen can never drift out of sync.

Chosen deliberately for our users: things a person remembers for life,
that don't need literacy or documents to answer, and that make sense for
artisans in rural India. Each one carries a Hindi translation so the
question can be shown in the user's own language.
"""

SECURITY_QUESTIONS = [
    {
        "id": "mother_name",
        "question_en": "What is your mother's name?",
        "question_hi": "आपकी माता जी का नाम क्या है?",
    },
    {
        "id": "birth_village",
        "question_en": "What is the name of your birth village or town?",
        "question_hi": "आपके जन्म गाँव या शहर का नाम क्या है?",
    },
    {
        "id": "first_craft",
        "question_en": "Which craft did you learn first?",
        "question_hi": "आपने सबसे पहले कौन सा शिल्प सीखा था?",
    },
    {
        "id": "favourite_festival",
        "question_en": "What is your favourite festival?",
        "question_hi": "आपका पसंदीदा त्योहार कौन सा है?",
    },
    {
        "id": "first_teacher",
        "question_en": "What is the name of the person who taught you your craft?",
        "question_hi": "आपको शिल्प सिखाने वाले व्यक्ति का नाम क्या है?",
    },
    {
        "id": "childhood_friend",
        "question_en": "What is your childhood best friend's name?",
        "question_hi": "आपके बचपन के सबसे अच्छे दोस्त का नाम क्या है?",
    },
]

VALID_QUESTION_IDS = {q["id"] for q in SECURITY_QUESTIONS}


def get_question(question_id: str):
    """Look up one question by its id. Returns None if the id is unknown."""
    for q in SECURITY_QUESTIONS:
        if q["id"] == question_id:
            return q
    return None
