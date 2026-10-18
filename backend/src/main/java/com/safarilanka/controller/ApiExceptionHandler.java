package com.safarilanka.controller;
import org.springframework.http.*; import org.springframework.web.bind.MethodArgumentNotValidException; import org.springframework.web.bind.annotation.*; import java.util.*;
@RestControllerAdvice
public class ApiExceptionHandler {
 @ExceptionHandler({IllegalArgumentException.class,IllegalStateException.class}) public ResponseEntity<?> bad(RuntimeException e){return ResponseEntity.badRequest().body(Map.of("message",e.getMessage()));}
 @ExceptionHandler(MethodArgumentNotValidException.class) public ResponseEntity<?> validation(MethodArgumentNotValidException e){String m=e.getBindingResult().getFieldErrors().stream().map(x->x.getField()+": "+x.getDefaultMessage()).findFirst().orElse("Validation failed"); return ResponseEntity.badRequest().body(Map.of("message",m));}
 @ExceptionHandler(Exception.class) public ResponseEntity<?> other(Exception e){return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message","Server error: "+e.getMessage()));}
}
