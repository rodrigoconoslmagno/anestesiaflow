package br.com.anestesiaflow.publicview.escala;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.anestesiaflow.escala.dto.EscalaSemanaDTO;
import br.com.anestesiaflow.escala.service.EscalaService;
import br.com.anestesiaflow.medico.dto.MedicoResponseDTO;
import br.com.anestesiaflow.medico.service.MedicoService;
import br.com.anestesiaflow.publicview.BasePublicController;

@RestController
@RequestMapping("/escala") /// Resultará em /api/public/escala
public class EscalaViewController implements BasePublicController {
    
	private final MedicoService medicoService;
	private final EscalaService escalaService;
	
	public EscalaViewController(MedicoService medicoService, EscalaService escalaService) {
		this.medicoService = medicoService;
		this.escalaService = escalaService;
	}
	
    @GetMapping("/medicos")
	public ResponseEntity<List<MedicoResponseDTO>> listar(@RequestParam(required = false) boolean ativo) {
    	if (ativo) {
        	return ResponseEntity.ok(medicoService.listarAtivos());
        }
        
        return ResponseEntity.ok(medicoService.listarTodos());
    }
    
    @GetMapping("/escalassemanais")
    public ResponseEntity<List<EscalaSemanaDTO>> escalas(@RequestParam int medicoId, 
    				@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data){
    	return ResponseEntity.ok(escalaService.listarSemanasMedicos(medicoId, data));
    }
}