package br.com.anestesiaflow.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
public class BusinessException extends RuntimeException {

	private static final long serialVersionUID = -5156580216419154260L;

	public BusinessException(String message) {
        super(message);
    }
	
}