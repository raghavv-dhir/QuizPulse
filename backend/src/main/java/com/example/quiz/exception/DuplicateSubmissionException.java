package com.example.quiz.exception;

import org.springframework.http.HttpStatus;

public class DuplicateSubmissionException extends AppException {
    public DuplicateSubmissionException(String message) {
        super(message, HttpStatus.CONFLICT, "DUPLICATE_SUBMISSION");
    }
}
