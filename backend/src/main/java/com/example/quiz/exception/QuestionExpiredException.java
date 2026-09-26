package com.example.quiz.exception;

import org.springframework.http.HttpStatus;

public class QuestionExpiredException extends AppException {
    public QuestionExpiredException(String message) {
        super(message, HttpStatus.BAD_REQUEST, "QUESTION_EXPIRED");
    }
}
