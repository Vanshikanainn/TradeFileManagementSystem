package com.trade.service.mapper;

import com.trade.model.dto.FileLoadResponseDTO;
import com.trade.model.entity.FileLoad;

public class FileLoadMapper {

    public static FileLoadResponseDTO toDTO(FileLoad fileLoad) {

        FileLoadResponseDTO dto = new FileLoadResponseDTO();

        dto.setId(fileLoad.getId());
        dto.setFilename(fileLoad.getFilename());
        dto.setLoadDate(fileLoad.getLoadDate());
        dto.setStatus(fileLoad.getStatus());
        dto.setRecordCount(fileLoad.getRecordCount());
        dto.setErrors(fileLoad.getErrors());

        return dto;
    }
}