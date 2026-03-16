package com.trade.dao.repository;

import com.trade.model.entity.FileLoad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FileLoadRepository extends JpaRepository<FileLoad, Long> {

}
