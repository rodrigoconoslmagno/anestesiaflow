package br.com.anestesiaflow.sudoku.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import br.com.anestesiaflow.escala.dto.EscalaResponseDTO;
import br.com.anestesiaflow.escala.dto.EscalaSemanaDTO;
import br.com.anestesiaflow.escala.repository.EscalaRepository;
import br.com.anestesiaflow.escala.service.EscalaService;
import br.com.anestesiaflow.sudoku.service.SudokuService;

@RestController
@RequestMapping("/sudoku")
public class SudokuController {

	private final EscalaRepository escalaRepository;
	private final SudokuService sudokuService;
	private final EscalaService escalaService;
	
	public SudokuController(EscalaRepository escalaRepository, SudokuService sudokuService, 
				EscalaService escalaService) {
		this.escalaRepository = escalaRepository;
		this.sudokuService = sudokuService;
		this.escalaService = escalaService;
	}
	
	@PreAuthorize("@auth.has(T(br.com.anestesiaflow.auth.permission.Permissoes).SUDOKU_ACESSAR)")
	@PostMapping("/listardia")
	public ResponseEntity<List<EscalaResponseDTO>> listardia(@RequestBody(required = false) Map<String, LocalDate> filtros) {
		if (filtros != null && filtros.get("data") != null) {
			return ResponseEntity.ok(sudokuService.listarPorData(filtros.get("data")));
		}
		return ResponseEntity.ok().build();
	}
	
	@PreAuthorize("@auth.has(T(br.com.anestesiaflow.auth.permission.Permissoes).SUDOKU_ALTERAR)")
	@PostMapping
    public ResponseEntity<List<EscalaResponseDTO>> criar(@Validated @RequestBody List<EscalaResponseDTO> dto) {
		EscalaSemanaDTO semana = new EscalaSemanaDTO(
				0,
			    null,
			    null,
				null,
				null,
				dto,
				null);
		List<EscalaResponseDTO> escalass = escalaService.salvar(semana);
        return ResponseEntity.status(HttpStatus.CREATED).body(escalass);
    }
	
	@PreAuthorize("@auth.has(T(br.com.anestesiaflow.auth.permission.Permissoes).SUDOKU_ARQUIVAR)")
	@PostMapping("/arquivar")
	public ResponseEntity<Integer> arquivar(@Validated @RequestBody LocalDate dataEscala) {
		return ResponseEntity.ok(escalaRepository.arquivarItensPorData(dataEscala));
	}
	
	@PreAuthorize("@auth.has(T(br.com.anestesiaflow.auth.permission.Permissoes).SUDOKU_ACESSAR)")
	@PostMapping("/arquivado")
	public ResponseEntity<Boolean> arquivado(@Validated @RequestBody Map<String, Object> payload) {
		LocalDate data = LocalDate.parse((String) payload.get("data"));
		Integer medicoId = null;
		if (payload.get("medicoId") != null) {
			medicoId = (Integer) payload.get("medicoId"); 
		}
		boolean habilitaArquivar = escalaRepository.existsByDataAndOptionalMedico(data, medicoId); 
		if (habilitaArquivar) {
			habilitaArquivar = escalaRepository.countConsultasArquivadas(data, medicoId) > 0;
		} else if (medicoId == null) {
			habilitaArquivar = !habilitaArquivar;
		}
		return ResponseEntity.ok(habilitaArquivar);
	}
}
