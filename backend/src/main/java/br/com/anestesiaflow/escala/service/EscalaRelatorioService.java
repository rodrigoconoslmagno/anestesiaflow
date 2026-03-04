package br.com.anestesiaflow.escala.service;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import br.com.anestesiaflow.escala.dto.EscalaResumoAnualClinicaResponseDTO;
import br.com.anestesiaflow.escala.dto.EscalaResumoAnualMedicoResponseDTO;
import br.com.anestesiaflow.escala.repository.EscalaRelatorioRepository;

@Service
public class EscalaRelatorioService {

	@Autowired
	private EscalaRelatorioRepository escalaRepository;
	
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
}
