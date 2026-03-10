package br.com.anestesiaflow.escala.service;

import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import br.com.anestesiaflow.escala.dto.EscalaResumoAnualClinicaResponseDTO;
import br.com.anestesiaflow.escala.dto.EscalaResumoAnualMedicoResponseDTO;
import br.com.anestesiaflow.escala.dto.EscalaSimetriaDTO;
import br.com.anestesiaflow.escala.dto.EscalaSimetriaEstResponseDTO;
import br.com.anestesiaflow.escala.dto.EscalaSimetriaMedicoResponseDTO;
import br.com.anestesiaflow.escala.repository.EscalaRelatorioRepository;

@Service
public class EscalaRelatorioService {

	private final EscalaRelatorioRepository escalaRepository;
	private final ObjectMapper objectMapper;
	
	public EscalaRelatorioService(EscalaRelatorioRepository escalaRepository, ObjectMapper objectMapper) {
		this.escalaRepository = escalaRepository;
		this.objectMapper = objectMapper;
	}
	
	public List<Integer> anosEscala(){
		return escalaRepository.findAllAnosEscalas();
	}
	
	public List<EscalaResumoAnualMedicoResponseDTO> resumoAnoMedico(Map<String, Object> filtros){
		int medicoId = (Integer) filtros.get("medicoId");
		int ano = (Integer) filtros.get("ano");
		return escalaRepository.findResumoAnualByMedico(medicoId, ano);
	}
	
	public List<EscalaResumoAnualClinicaResponseDTO> resumoAnoClinica(Map<String, Object> filtros){
		int estId = (Integer) filtros.get("estId");
		int ano = (Integer) filtros.get("ano");
		return escalaRepository.findResumoAnualByClinica(estId, ano);
	}
	
	public List<EscalaSimetriaEstResponseDTO> resumoAssimetria(Map<String, Object> filtros){
		String arquivado = (String) filtros.get("tipo");
		return escalaRepository.buscarRelatorioAssimetria(arquivado).stream()
	            .map(this::convert)
	            .toList();
		
	}
	
	private EscalaSimetriaEstResponseDTO convert(EscalaSimetriaDTO raw) {
        try {
            List<EscalaSimetriaMedicoResponseDTO> medicos = objectMapper.readValue(
                raw.getDadosMedicos(), 
                new TypeReference<List<EscalaSimetriaMedicoResponseDTO>>() {}
            );
            return new EscalaSimetriaEstResponseDTO(raw.getEstId(), raw.getSigla(), raw.getCor(), 
            		raw.getIcone(), raw.getDataInicio(), raw.getDataFim(), medicos);
        } catch (JsonProcessingException e) {
            return new EscalaSimetriaEstResponseDTO(raw.getEstId(), raw.getSigla(), raw.getCor(), 
            		raw.getIcone(), raw.getDataInicio(), raw.getDataFim(), List.of());
        }
    }
}
