package br.com.anestesiaflow.medico.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import br.com.anestesiaflow.medico.dto.MedicoRequestDTO;
import br.com.anestesiaflow.medico.dto.MedicoResponseDTO;
import br.com.anestesiaflow.medico.service.MedicoService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/medico")
public class MedicoController {
	
	@Autowired
	private MedicoService medicoService;
	
	@PostMapping("/listar")
	public ResponseEntity<List<MedicoResponseDTO>> listar() {
        return ResponseEntity.ok(medicoService.listarTodos());
    }

	@PostMapping
    public ResponseEntity<MedicoResponseDTO> criar(@Validated @RequestBody MedicoRequestDTO dto) {
        MedicoResponseDTO novoMedico = medicoService.salvar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(novoMedico);
    }
	
	@PutMapping("/{id}")
	public ResponseEntity<MedicoResponseDTO> atualizar(
	        @PathVariable int id, 
	        @Valid @RequestBody MedicoRequestDTO request) {
	    
		MedicoResponseDTO response = medicoService.atualizar(id, request);
	    return ResponseEntity.ok(response);
	}
	
	@DeleteMapping("/{id}")
	public ResponseEntity<Void> excluir(@PathVariable int id) {
	    medicoService.excluir(id);
	    return ResponseEntity.noContent().build(); // Retorna 204 No Content (sucesso sem corpo)
	}
}
