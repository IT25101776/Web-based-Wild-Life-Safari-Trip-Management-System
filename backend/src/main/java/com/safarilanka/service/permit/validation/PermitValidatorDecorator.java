package com.safarilanka.service.permit.validation;

/** Abstract decorator: forwards to the wrapped validator before adding a new rule. */
public abstract class PermitValidatorDecorator implements PermitValidator {
    protected final PermitValidator next;

    protected PermitValidatorDecorator(PermitValidator next) {
        this.next = next;
    }
}
