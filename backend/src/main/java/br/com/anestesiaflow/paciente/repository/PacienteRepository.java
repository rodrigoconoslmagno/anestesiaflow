package br.com.anestesiaflow.paciente.repository;

import java.time.LocalDate;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import br.com.anestesiaflow.paciente.entidade.Paciente;
import br.com.anestesiaflow.paciente.entidade.PacienteProcedimento;

public interface PacienteRepository extends JpaRepository<Paciente, Integer> {
	
	@EntityGraph(attributePaths = {"procedimentos"})
	Paciente findByNome(String nome);
	
	@Query("SELECT pp FROM PacienteProcedimento pp " +			   
		       "WHERE pp.dataProcedimento = :data " +
			   " AND pp.paciente = :paciente " + 
		       " AND pp.procedimento = :procedimento")
	PacienteProcedimento findByProcedimentoData(Paciente paciente, LocalDate data, String procedimento);
	
}