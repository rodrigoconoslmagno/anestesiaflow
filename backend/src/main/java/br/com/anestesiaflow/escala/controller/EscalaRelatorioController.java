package br.com.anestesiaflow.escala.controller;

import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import br.com.anestesiaflow.escala.dto.EscalaResumoAnualClinicaResponseDTO;
import br.com.anestesiaflow.escala.dto.EscalaResumoAnualMedicoResponseDTO;
import br.com.anestesiaflow.escala.dto.EscalaSimetriaEstResponseDTO;
import br.com.anestesiaflow.escala.service.EscalaRelatorioService;

@RestController
@RequestMapping("/escala-relatorio")
public class EscalaRelatorioController {
	
	@Autowired
	public EscalaRelatorioService escalaService;
	
	@PostMapping("/anos-escalas")
	public ResponseEntity<List<Integer>> anosEscalas(){
		return ResponseEntity.ok(escalaService.anosEscala());	
	}

	@PostMapping("/resumo-anual-medico")
	public ResponseEntity<List<EscalaResumoAnualMedicoResponseDTO>> resumoAnualMedico(@RequestBody(required = false) Map<String, Object> filtros){
		return ResponseEntity.ok(escalaService.resumoAnoMedico(filtros));
	}
	
	@PostMapping("/resumo-anual-clinica")
	public ResponseEntity<List<EscalaResumoAnualClinicaResponseDTO>> resumoAnualClinica(@RequestBody(required = false) Map<String, Object> filtros){
		return ResponseEntity.ok(escalaService.resumoAnoClinica(filtros));
	}
	
	@PostMapping("/simetria")
	public ResponseEntity<List<EscalaSimetriaEstResponseDTO>> resumoSimetria(@RequestBody(required = false) Map<String, Object> filtros){
		return ResponseEntity.ok(escalaService.resumoAssimetria());
	}
}
