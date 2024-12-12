class Calisan{
    constructor(ad, soyad, yas){
        this.ad=ad;
        this.soyad=soyad;
        this.yas=yas;
    }

    adSoyadGetir(){
        return this.ad+' '+this.soyad;
    }

    toString(){
        return this.adSoyadGetir();
    }
}

class Muhendis extends Calisan{
    constructor(ad, soyad, yas, birim, maas){
        super(ad, soyad, yas);
        this.birim=birim;
        this.maas=maas;
    }

    toString(){
        return this.adSoyadGetir()+' '+this.birim;
    }
}

m1 = new Muhendis('Tarik', 'Mugul', 21, 'ArGe', 500000);

let calisanlar = [];
calisanlar.push(new Muhendis("Efe", "Can", 25, "Yazilim", 5000));
calisanlar.push(new Calisan("Ege", "Can", 30));
calisanlar.push(m1);

for(let calisan of calisanlar){
    console.log(calisan.toString());
}

let yeniJson = JSON.stringify(calisanlar);
console.log(yeniJson);
