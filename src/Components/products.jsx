import { useState, useEffect, useReducer } from "react";
import {
  Card,
  Accordion,
  Button,
  Container,
  Row,
  Col,
  Image,
  Input,
} from "react-bootstrap";
import axios from "axios";

//simulate getting products from DataBase
const products = [
  { name: "Apples", country: "Italy", cost: 3, instock: 10 },
  { name: "Oranges", country: "Spain", cost: 4, instock: 3 },
  { name: "Beans", country: "USA", cost: 2, instock: 5 },
  { name: "Cabbage", country: "USA", cost: 1, instock: 8 },
];
//=========Cart=============

const useDataApi = (initialUrl, initialData) => {
  const [url, setUrl] = useState(initialUrl);
  const [state, dispatch] = useReducer(dataFetchReducer, {
    isLoading: false,
    isError: false,
    data: initialData,
  });
  
  //console.log(`useDataApi called`);

  useEffect(() => {
    console.log("useEffect Called");
    let didCancel = false;
    const fetchData = async () => {
      dispatch({ type: "FETCH_INIT" });
      try {
        const result = await axios(url);
        //console.log("FETCH FROM URL");
        if (!didCancel) {
          dispatch({ type: "FETCH_SUCCESS", payload: result.data.data });
        }
      } catch (error) {
        if (!didCancel) {
          dispatch({ type: "FETCH_FAILURE" });
        }
      }
    };
    fetchData();
    return () => {
      didCancel = true;
    };
  }, [url]);

  return [state, setUrl];

};

const dataFetchReducer = (state, action) => {
  switch (action.type) {
    case "FETCH_INIT":
      return {
        ...state,
        isLoading: true,
        isError: false,
      };
    case "FETCH_SUCCESS":
      return {
        ...state,
        isLoading: false,
        isError: false,
        data: action.payload,
      };
    case "FETCH_FAILURE":
      return {
        ...state,
        isLoading: false,
        isError: true,
      };
    default:
      throw new Error();
  }
};

const Products = (props) => {
  //removed React.useState from next 2 lines
  const [items, setItems] = useState(products);
  const [cart, setCart] = useState([]);
  const [query, setQuery] = useState("http://localhost:1337/api/products");
  //const [total, setTotal] = React.useState(0);  
  const [{ data }, apiCall] = useDataApi(
    "http://localhost:1337/api/products",
    {
      data: [],
    }
  );
  //console.log(`Rendering Products`, data);

  const addToCart = (e) => {
    let name = e.target.name;
    let item = items.find((item) => item.name === name);
    if (item.instock < 1) {
      alert('Out of stock!');
      return;
    }
    setCart([...cart, item]);
    setItems((currentState) => {
      let updateQuantity = currentState.find(x => x.name === item.name);
      updateQuantity.instock--;
      return currentState;
    })
  };
  const deleteCartItem = (index) => {
    let newCart = cart.filter((item, i) => index !== i);
    setCart(newCart);

    let itemToRestock = items.find((item, i) => i === index);
    //console.log(itemToRestock)
      setItems((currentState) => {
      let restockItem = currentState.find(x => x.name === itemToRestock.name);
      restockItem.instock++;
      return currentState;
    })
  };
   const photos = ["apple.png", "orange.png", "beans.png", "cabbage.png"];

console.log(items);

  let list = items.map((item, index) => {
    return (
      <li key={index}>
        <Image src={photos[index % 4]} width={70} roundedCircle></Image>
        <p>{item.name}: ${item.cost}</p>
        <p>Quanity: {item.instock}</p>
        <Button name={item.name} type="button" onClick={addToCart}>Add to Cart</Button>
      </li>
    );
  });

    //console.log('items', items);
    //let n = index + 189;
    //let urlPic = "https://picsum.photos/id/" + n + "/50/50";
    //console.log(item)

    let cartList = cart.map((item, index) => {
      return (
        <Accordion.Item key={index} eventKey={index}>
          <Accordion.Header>{item.name}</Accordion.Header>
          <Accordion.Body onClick={() => deleteCartItem(index)}>
            $ {item.cost} from {item.country}
          </Accordion.Body>
        </Accordion.Item>
      );
    });

  let finalList = () => {
    let total = checkOut();
    let final = cart.map((item, index) => {
      return (
        <div key={index} index={index}>
          {item.name}
        </div>
      );
    });
    return { final, total };
  };

  const checkOut = () => {
    let costs = cart.map((item) => item.cost);
    const reducer = (accum, current) => accum + current;
    let newTotal = costs.reduce(reducer, 0);
    //console.log(`total updated to ${newTotal}`);
    return newTotal;
  };
  // implement the restockProducts function
  const restockProducts = (url) => {
    console.log('restocking...');
    apiCall(url);
    let newItems = data.map((newItem) => {
      console.log(newItem);
      let { name, country, cost, instock } = newItem.attributes;
      return { name, country, cost, instock };
    });

    setItems((currentItems) => {
      if (currentItems.length < 1) {
        return newItems;
      }
      currentItems.forEach(currentItem => {
        let restockQuantity = newItems.find(y => y.name === currentItem.name).instock;
        currentItem.instock += restockQuantity;

      })

      return [...currentItems];
    });
  };

  return (
    <Container>
      <Row>
        <Col>
          <h1>Product List</h1>
          <ul style={{ listStyleType: "none" }}>{list}</ul>
        </Col>
        <Col>
          <h1>Cart Contents</h1>
          <Accordion>{cartList}</Accordion>
        </Col>
        <Col>
          <h1>CheckOut </h1>
          <Button onClick={checkOut}>CheckOut $ {finalList().total}</Button>
          <div> {finalList().total > 0 && finalList().final} </div>
        </Col>
      </Row>
      <Row>
        <form
          onSubmit={(event) => {
            restockProducts(query);
            //console.log(`Restock called on ${query}`);
            event.preventDefault();
          }}
        >
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button type="submit">ReStock Products</Button>
        </form>
      </Row>
    </Container>
  );
};
// ========================================
export default Products;
