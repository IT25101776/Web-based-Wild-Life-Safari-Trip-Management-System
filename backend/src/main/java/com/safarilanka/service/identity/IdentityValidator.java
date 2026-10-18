package com.safarilanka.service.identity;

/** Common product interface used by the Factory Pattern for tourist identity validation. */
public interface IdentityValidator {
    void validate(String value);
}
