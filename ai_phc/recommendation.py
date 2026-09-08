def get_recommendation(score, risk):

    if risk == "High":
        return "Urgent medical assessment recommended"

    elif risk == "Medium":
        return "Medical consultation recommended"

    else:
        return "Routine follow-up recommended"