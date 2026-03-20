package br.com.anestesiaflow.configs.ui;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface UIConfig {
	String label();
    UIComponentType type();
    String placeholder() default "";
    boolean required() default false;
}
