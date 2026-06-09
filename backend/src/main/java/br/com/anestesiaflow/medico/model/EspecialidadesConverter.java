package br.com.anestesiaflow.medico.model;

import br.com.anestesiaflow.framework.utils.BaseEnumListConverter;
import jakarta.persistence.Converter;

@Converter
public class EspecialidadesConverter extends BaseEnumListConverter<MedicoEspecialidade> {
    
    public EspecialidadesConverter() {
        super(MedicoEspecialidade.class);
    }
}