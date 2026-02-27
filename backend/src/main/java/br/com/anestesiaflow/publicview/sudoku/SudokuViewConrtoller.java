package br.com.anestesiaflow.publicview.sudoku;

import java.time.LocalDate;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import br.com.anestesiaflow.escala.dto.EscalaResponseDTO;
import br.com.anestesiaflow.escala.service.EscalaService;
import br.com.anestesiaflow.publicview.BasePublicController;

@RestController
@RequestMapping("/sudoku") 
public class SudokuViewConrtoller implements BasePublicController {
	
	@Autowired
	private EscalaService escalaService;
	
	@GetMapping("/sudokudia")
	public ResponseEntity<List<EscalaResponseDTO>> listardia(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
		return ResponseEntity.ok(escalaService.listarPorData(data));
	}

}
