package br.com.anestesiaflow.procedimento.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.anestesiaflow.procedimento.entidade.Procedimento;

public interface ProcedimentoRepository  extends JpaRepository<Procedimento, Integer> {

}
