package br.com.anestesiaflow.procedimento.controller;

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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.anestesiaflow.procedimento.dto.ProcedimentoRequestDTO;
import br.com.anestesiaflow.procedimento.dto.ProcedimentoResponseDTO;
import br.com.anestesiaflow.procedimento.service.ProcedimentoService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/procedimento")
public class ProcedimentoController {

    @Autowired
    private ProcedimentoService procedimentoService;

    @PreAuthorize("@auth.has(T(br.com.anestesiaflow.auth.permission.Permissoes).PROCEDIMENTO_ACESSAR)")
	@PostMapping("/listar")
	public ResponseEntity<List<ProcedimentoResponseDTO>> listar(@RequestBody(required = false) Map<String, Object> filtros) {
        if (filtros != null && filtros.get("ativo") != null) {
        	return ResponseEntity.ok(procedimentoService.listarAtivos());
        }
        
        return ResponseEntity.ok(procedimentoService.listarTodos());
    }
	
	@PreAuthorize("@auth.has(T(br.com.anestesiaflow.auth.permission.Permissoes).PROCEDIMENTO_ACESSAR)")
	@PostMapping("/buscarid")
	public ResponseEntity<ProcedimentoResponseDTO> buscaPorId(@RequestBody Map<String, Integer> payload) {
		Integer id = payload.get("id");
		return ResponseEntity.ok(procedimentoService.buscaId(id));
	}

	@PreAuthorize("@auth.has(T(br.com.anestesiaflow.auth.permission.Permissoes).PROCEDIMENTO_NOVO)")
	@PostMapping
    public ResponseEntity<ProcedimentoResponseDTO> criar(@Validated @RequestBody ProcedimentoRequestDTO dto) {
        ProcedimentoResponseDTO novoProcedimento = procedimentoService.salvar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(novoProcedimento);
    }
	
	@PreAuthorize("@auth.has(T(br.com.anestesiaflow.auth.permission.Permissoes).PROCEDIMENTO_ALTERAR)")
	@PutMapping("/{id}")
	public ResponseEntity<ProcedimentoResponseDTO> atualizar(
	        @PathVariable int id, 
	        @Valid @RequestBody ProcedimentoRequestDTO request) {
	    
		ProcedimentoResponseDTO response = procedimentoService.atualizar(id, request);
	    return ResponseEntity.ok(response);
	}
	
	@PreAuthorize("@auth.has(T(br.com.anestesiaflow.auth.permission.Permissoes).PROCEDIMENTO_EXCLUIR)")
	@DeleteMapping("/{id}")
	public ResponseEntity<Void> excluir(@PathVariable int id) {
	    procedimentoService.excluir(id);
	    return ResponseEntity.noContent().build();
	}
}
