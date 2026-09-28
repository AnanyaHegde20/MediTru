package com.meditru.controller;

import com.meditru.entity.User;
import com.meditru.service.UserService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final UserService service;

    public PatientController(UserService service) {
        this.service = service;
    }

    @GetMapping
    public List<User> list() {
        return service.findPatients();
    }
}
