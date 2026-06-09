package br.com.anestesiaflow.framework.utils;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import br.com.anestesiaflow.framework.persistence.BaseEnum;
import jakarta.persistence.AttributeConverter;

public abstract class BaseEnumListConverter<E extends Enum<E> & BaseEnum> 
        implements AttributeConverter<List<E>, String> {

    private final Class<E> enumClass;

    protected BaseEnumListConverter(Class<E> enumClass) {
        this.enumClass = enumClass;
    }

    @Override
    public String convertToDatabaseColumn(List<E> attribute) {
        if (attribute == null || attribute.isEmpty()) {
            return null;
        }
        return attribute.stream()
        		.map(e -> String.valueOf(e.getCodigo()))
                .collect(Collectors.joining(","));
    }

    @Override
    public List<E> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return null;
        }
        
        // Busca o Enum correto pelo ID dinamicamente
        return Arrays.stream(dbData.split(","))
                .map(id -> Arrays.stream(enumClass.getEnumConstants())
                        .filter(e -> Integer.valueOf(id).equals(e.getCodigo()))
                        .findFirst()
                        .orElseThrow(() -> new IllegalArgumentException(
                                "ID inválido para o Enum " + enumClass.getSimpleName() + ": " + id)))
                .collect(Collectors.toList());
    }
}