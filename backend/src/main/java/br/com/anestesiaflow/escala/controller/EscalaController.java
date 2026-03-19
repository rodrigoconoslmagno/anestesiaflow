package br.com.anestesiaflow.escala.controller;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import br.com.anestesiaflow.escala.dto.EscalaEdicaoDTO;
import br.com.anestesiaflow.escala.dto.EscalaResponseDTO;
import br.com.anestesiaflow.escala.dto.EscalaSemanaSummaryDTO;
import br.com.anestesiaflow.escala.service.EscalaService;

@RestController
@RequestMapping("/escala")
public class EscalaController {
	
	@Autowired
	private EscalaService escalaService;
	
	@PreAuthorize("@auth.has(T(br.com.anestesiaflow.auth.permission.Permissoes).MEDICO_ACESSAR)")
	@PostMapping("/listar")
	public ResponseEntity<List<EscalaSemanaSummaryDTO>> listar(@RequestBody(required = false) Map<String, Object> filtros) {
        return ResponseEntity.ok(escalaService.listarTodos(filtros));
    }
	
	@PreAuthorize("@auth.has(T(br.com.anestesiaflow.auth.permission.Permissoes).SUDOKU_ACESSAR)")
	@PostMapping("/listardia")
	public ResponseEntity<List<EscalaResponseDTO>> listardia(@RequestBody(required = false) Map<String, LocalDate> filtros) {
		if (filtros != null && filtros.get("data") != null) {
			return ResponseEntity.ok(escalaService.listarPorData(filtros.get("data"), false));
		}
		return ResponseEntity.ok().build();
	}
	
	@PreAuthorize("@auth.has(T(br.com.anestesiaflow.auth.permission.Permissoes).MEDICO_ACESSAR)")
	@PostMapping("/buscarid")
	public ResponseEntity<EscalaEdicaoDTO> buscaPorId(@RequestBody Map<String, Integer> payload) {
		Integer id = payload.get("id");
		return ResponseEntity.ok(escalaService.buscarId(id));
	}
	
	@PreAuthorize("@auth.has(T(br.com.anestesiaflow.auth.permission.Permissoes).ESCALA_ALTERAR)")
	@PostMapping
    public ResponseEntity<List<EscalaResponseDTO>> criar(@Validated @RequestBody EscalaEdicaoDTO dto) {
        List<EscalaResponseDTO> novEscala = escalaService.salvar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(novEscala);
    }
	
	@PreAuthorize("@auth.has(T(br.com.anestesiaflow.auth.permission.Permissoes).SIMETRIA_ALTERAR)")
	@PostMapping("/simetria")
    public ResponseEntity<EscalaResponseDTO> criar(@Validated @RequestBody EscalaResponseDTO dto) {
		EscalaResponseDTO escalas = escalaService.salvar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(escalas);
    }
	
	@PreAuthorize("@auth.has(T(br.com.anestesiaflow.auth.permission.Permissoes).ESCALA_EXCLUIR)")
	@DeleteMapping("/{id}")
	public ResponseEntity<Void> excluir(@PathVariable int id) {
	    escalaService.excluir(id);
	    return ResponseEntity.noContent().build();
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
