package br.com.anestesiaflow.escala.controller;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import br.com.anestesiaflow.escala.dto.EscalaResponseDTO;
import br.com.anestesiaflow.escala.dto.EscalaSemanaDTO;
import br.com.anestesiaflow.escala.dto.EscalaSemanaSummaryDTO;
import br.com.anestesiaflow.escala.service.EscalaService;

@RestController
@RequestMapping("/escala")
public class EscalaController {
	
	@Autowired
	private EscalaService escalaService;
	
	@PostMapping("/listar")
	public ResponseEntity<List<EscalaSemanaSummaryDTO>> listar(@RequestBody(required = false) Map<String, Object> filtros) {
        return ResponseEntity.ok(escalaService.listarTodos());
    }
	
	@PostMapping("/listardia")
	public ResponseEntity<List<EscalaResponseDTO>> listardia(@RequestBody(required = false) Map<String, LocalDate> filtros) {
		if (filtros != null && filtros.get("data") != null) {
			return ResponseEntity.ok(escalaService.listarPorData(filtros.get("data")));
		}
		return ResponseEntity.ok().build();
	}
	
	@PostMapping("/buscarid")
	public ResponseEntity<EscalaSemanaDTO> buscaPorId(@RequestBody Map<String, Integer> payload) {
		Integer id = payload.get("id");
		return ResponseEntity.ok(escalaService.buscarId(id));
	}
	
	@PostMapping
    public ResponseEntity<List<EscalaResponseDTO>> criar(@Validated @RequestBody EscalaSemanaDTO dto) {
        List<EscalaResponseDTO> novEscala = escalaService.salvar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(novEscala);
    }
	
	@PostMapping("/sudoku")
    public ResponseEntity<List<EscalaResponseDTO>> criar(@Validated @RequestBody List<EscalaResponseDTO> dto) {
		EscalaSemanaDTO semana = new EscalaSemanaDTO(
				0,
			    null,
			    null,
				null,
				null,
				dto);
		List<EscalaResponseDTO> escalass = escalaService.salvar(semana);
        return ResponseEntity.status(HttpStatus.CREATED).body(escalass);
    }
	
	@DeleteMapping("/{id}")
	public ResponseEntity<Void> excluir(@PathVariable int id) {
	    escalaService.excluir(id);
	    return ResponseEntity.noContent().build(); // Retorna 204 No Content (sucesso sem corpo)
	}
	
	@PostMapping("/upload")
	public ResponseEntity<Map<String, Object>> importarPlanilha(@RequestParam("file") MultipartFile file) {
        try {
            // Chamamos o serviço que vai navegar pelas abas e processar os dados
            List<String> logs = escalaService.processarPlanilhaEscala(file);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Processamento concluído com sucesso");
            response.put("detalhes", logs);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erro ao processar planilha: " + e.getMessage()));
        }
    }

}
